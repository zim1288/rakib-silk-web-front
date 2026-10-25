/**
 * Saree Inventory Master Page Orchestrator.
 *
 * Coordinates live MongoDB inventory state, real-time CRUD operations,
 * search and column-level sorting, high-resolution visual previews, and test data safety resets.
 *
 * Modular Architecture:
 * - {@link InventoryHeader}: Top navigation banner, test data trigger, and item creation action.
 * - {@link InventoryItemForm}: Inline saree creation & editing card with device image compression.
 * - {@link InventoryFilterBar}: Live search box and count badge.
 * - {@link InventoryImageModal}: Full-resolution saree inspection panel with 100% zoom toggle.
 * - {@link InventoryTable}: Sortable data table with thumbnails, pricing badges, and inline delete safeguard.
 * - {@link InventoryResetSafetyModal}: High-security confirmation modal for database wipes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InventoryItem } from '../types';
import {
  getInventory,
  saveInventoryItem,
  deleteInventoryItem,
  resetInventoryData,
} from '../services/api';
import {
  validateModelName,
  validatePositiveNumber,
  validatePositiveInteger,
} from '../utils/validation';
import { logAction } from '../services/history';
import {
  InventoryHeader,
  InventoryFilterBar,
  InventoryItemForm,
  InventoryImageModal,
  InventoryTable,
  InventoryResetSafetyModal,
  InventorySortField,
  InventorySortOrder,
} from '../components/inventory';

export const InventoryPage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  // Core Data State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<InventorySortField>('id');
  const [sortOrder, setSortOrder] = useState<InventorySortOrder>('desc');

  // Inline Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modelName, setModelName] = useState('');
  const [brandCategory, setBrandCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [pieceCount, setPieceCount] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Form Field Validation Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [countError, setCountError] = useState<string | null>(null);

  // Inline Delete Safeguard State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // High-Resolution Image Preview State
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const [isOriginalSize, setIsOriginalSize] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Reset Test Data Confirmation & Safety Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetButtonHidden, setIsResetButtonHidden] = useState<boolean>(() => {
    return localStorage.getItem('hide_inventory_reset_btn') === 'true';
  });
  const [alsoHideButton, setAlsoHideButton] = useState(false);

  useEffect(() => {
    document.title = 'Inventory - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadInventory(true);

    // Multi-Device Real-Time Auto-Sync:
    // 1. Refetch freshest stock when user focuses or unlocks their device
    const handleFocus = () => {
      loadInventory(false);
    };
    window.addEventListener('focus', handleFocus);

    // 2. Background polling heartbeat every 12 seconds so edits on other devices reflect live
    const syncInterval = setInterval(() => {
      loadInventory(false);
    }, 12000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [userEmail, navigate]);

  /**
   * Fetches latest active inventory stock from the backend API.
   */
  const loadInventory = async (showSpinner: boolean = true) => {
    if (showSpinner) setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getInventory();
      setItems(data);
    } catch (err: unknown) {
      if (showSpinner) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch inventory items';
        setErrorMessage(msg);
      }
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  /**
   * Prepares and opens the blank creation form.
   */
  const handleOpenAddForm = () => {
    setEditingId(null);
    setModelName('');
    setBrandCategory('');
    setUnitPrice('');
    setPieceCount('');
    setImageUrl('');
    setNameError(null);
    setPriceError(null);
    setCountError(null);
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  /**
   * Populates form fields with existing record data for editing.
   */
  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setModelName(item.modelName || '');
    setBrandCategory(item.brandCategory || '');
    setUnitPrice(item.unitPrice ? String(item.unitPrice) : '');
    setPieceCount(item.pieceCount ? String(item.pieceCount) : '');
    setImageUrl(item.imageUrl || '');
    setNameError(null);
    setPriceError(null);
    setCountError(null);
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  /**
   * Cancels editing mode and clears form inputs.
   */
  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setNameError(null);
    setPriceError(null);
    setCountError(null);
  };

  /**
   * Validates form inputs and commits new or updated saree item to MongoDB.
   */
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nErr = validateModelName(modelName);
    const pErr = validatePositiveNumber(unitPrice, 'Unit price');
    const cErr = validatePositiveInteger(pieceCount, 'Piece count');

    setNameError(nErr);
    setPriceError(pErr);
    setCountError(cErr);

    if (nErr || pErr || cErr) {
      return;
    }

    const itemId = editingId !== null ? editingId : Date.now();
    const itemPayload: InventoryItem = {
      id: itemId,
      modelName: modelName.trim(),
      brandCategory: brandCategory.trim() || 'General Silk',
      unitPrice: Number(unitPrice),
      pieceCount: Number(pieceCount),
      imageUrl: imageUrl.trim() || '',
    };

    setIsLoading(true);
    try {
      await saveInventoryItem(itemPayload);
      logAction({
        module: 'Inventory',
        action: editingId !== null ? 'UPDATE' : 'CREATE',
        targetId: itemPayload.id,
        modelName: itemPayload.modelName,
        description:
          editingId !== null
            ? `Updated saree "${itemPayload.modelName}": ${itemPayload.pieceCount} pcs @ ৳${itemPayload.unitPrice.toLocaleString()}`
            : `Added new saree "${itemPayload.modelName}": ${itemPayload.pieceCount} pcs @ ৳${itemPayload.unitPrice.toLocaleString()} (${itemPayload.brandCategory})`,
        userEmail,
      });
      setSuccessMessage(
        editingId !== null
          ? `Item "${itemPayload.modelName}" updated successfully.`
          : `Item "${itemPayload.modelName}" added successfully.`
      );
      handleCancelForm();
      await loadInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save inventory item';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Triggers inline delete confirmation state for a specific item.
   */
  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  /**
   * Confirms and executes deletion of an inventory item.
   */
  const handleConfirmDelete = async (id: number) => {
    const deletedItem = items.find((i) => i.id === id);
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteInventoryItem(id);
      logAction({
        module: 'Inventory',
        action: 'DELETE',
        targetId: id,
        modelName: deletedItem?.modelName || `Item #${id}`,
        description: `Deleted saree item #${id} (${deletedItem?.modelName || 'Stock entry'})`,
        userEmail,
      });
      setSuccessMessage(`Item #${id} deleted successfully.`);
      setDeleteConfirmId(null);
      await loadInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to delete item #${id}`;
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Wipes test data across the current user's inventory collection.
   */
  const handleConfirmResetData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await resetInventoryData(items);
      setSuccessMessage('Test data reset complete: All inventory items deleted.');
      if (alsoHideButton) {
        localStorage.setItem('hide_inventory_reset_btn', 'true');
        setIsResetButtonHidden(true);
      }
      setIsResetModalOpen(false);
      await loadInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset test data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hides the reset test data button from UI without deleting records.
   */
  const handleHideResetButton = () => {
    localStorage.setItem('hide_inventory_reset_btn', 'true');
    setIsResetButtonHidden(true);
    setIsResetModalOpen(false);
    setSuccessMessage('Reset button hidden from header. You can re-enable it in Settings anytime.');
  };

  /**
   * Toggles sorting order or sets active sort field.
   */
  const handleSort = (field: InventorySortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /**
   * Memoized filtered and sorted inventory collection.
   */
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      if (!searchQuery.trim()) return true;
      return item.modelName.toLowerCase().includes(searchQuery.trim().toLowerCase());
    });

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal || '').toLowerCase();
        bVal = ((bVal as string) || '').toLowerCase();
      }

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, searchQuery, sortField, sortOrder]);

  return (
    <div className="page-wrapper">
      <InventoryHeader
        isResetButtonHidden={isResetButtonHidden}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        isFormVisible={isFormVisible}
        onOpenAddForm={handleOpenAddForm}
        isLoading={isLoading}
      />

      {errorMessage && (
        <div id="error-msg" data-testid="error-msg" className="alert-box alert-error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div id="success-msg" data-testid="success-msg" className="alert-box alert-success">
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div id="loading-spinner" data-testid="loading-spinner" className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">
            Processing inventory request... (Server may take ~30s on cold start)
          </span>
        </div>
      )}

      {/* Inline Add / Edit Form */}
      {isFormVisible && (
        <InventoryItemForm
          editingId={editingId}
          modelName={modelName}
          onModelNameChange={(val) => {
            setModelName(val);
            if (nameError) setNameError(validateModelName(val));
          }}
          brandCategory={brandCategory}
          onBrandCategoryChange={setBrandCategory}
          unitPrice={unitPrice}
          onUnitPriceChange={(val) => {
            setUnitPrice(val);
            if (priceError) setPriceError(validatePositiveNumber(val, 'Unit price'));
          }}
          pieceCount={pieceCount}
          onPieceCountChange={(val) => {
            setPieceCount(val);
            if (countError) setCountError(validatePositiveInteger(val, 'Piece count'));
          }}
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          nameError={nameError}
          priceError={priceError}
          countError={countError}
          isLoading={isLoading}
          onSubmit={handleSaveItem}
          onCancel={handleCancelForm}
          onError={setErrorMessage}
        />
      )}

      {/* Search and Table Section */}
      <div className="table-controls-card">
        <InventoryFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={filteredAndSortedItems.length}
        />

        {/* Large Image Preview Card */}
        {previewItem && (
          <InventoryImageModal
            previewItem={previewItem}
            isOriginalSize={isOriginalSize}
            onToggleOriginalSize={() => setIsOriginalSize(!isOriginalSize)}
            imageNaturalSize={imageNaturalSize}
            onImageLoad={setImageNaturalSize}
            onClose={() => {
              setPreviewItem(null);
              setIsOriginalSize(false);
              setImageNaturalSize(null);
            }}
          />
        )}

        <InventoryTable
          items={filteredAndSortedItems}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onPreviewItem={setPreviewItem}
          onEditItem={handleStartEdit}
          deleteConfirmId={deleteConfirmId}
          onDeleteClick={handleDeleteClick}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          isLoading={isLoading}
          searchQuery={searchQuery}
        />
      </div>

      {/* Reset Test Data Confirmation & Safety Modal */}
      <InventoryResetSafetyModal
        isOpen={isResetModalOpen}
        itemsCount={items.length}
        alsoHideButton={alsoHideButton}
        onAlsoHideButtonChange={setAlsoHideButton}
        onHideButtonOnly={handleHideResetButton}
        onConfirmReset={handleConfirmResetData}
        onClose={() => setIsResetModalOpen(false)}
        isLoading={isLoading}
      />
    </div>
  );
};
