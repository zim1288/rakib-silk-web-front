/**
 * Loom Batch Production Page Orchestrator.
 *
 * Coordinates saree weaving queues, batch manufacturing deadlines,
 * stage progression (Pending -> In Progress -> Completed), and live backend synchronization.
 *
 * Modular Architecture:
 * - {@link ProductionHeader}: Top navigation banner and 'Add Production Order' trigger.
 * - {@link ProductionFilterBar}: Real-time model search and lifecycle status filter dropdown.
 * - {@link ProductionOrderForm}: Inline form for scheduling or updating loom batch orders.
 * - {@link ProductionTable}: Sortable order table with status pills and deletion safeguards.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProductionItem, ProductionStatus } from '../types';
import {
  getProduction,
  saveProductionItems,
  deleteProductionItem,
} from '../services/api';
import {
  validateModelName,
  validatePositiveInteger,
} from '../utils/validation';
import { logAction } from '../services/history';
import {
  ProductionHeader,
  ProductionFilterBar,
  ProductionOrderForm,
  ProductionTable,
  ProductionSortField,
  ProductionSortOrder,
} from '../components/production';

export const ProductionPage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  // Core Data State
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search, Filter, and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<'ALL' | 'Rakib Silk' | 'Rakib Fashion'>('ALL');
  const [sortField, setSortField] = useState<ProductionSortField>('id');
  const [sortOrder, setSortOrder] = useState<ProductionSortOrder>('desc');

  // Inline Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modelName, setModelName] = useState('');
  const [brandCategory, setBrandCategory] = useState<string>('Rakib Silk');
  const [quantity, setQuantity] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [status, setStatus] = useState<ProductionStatus>('Pending');

  // Form Field Validation Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Inline Delete Safeguard State
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Production - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadProduction(true);

    const handleFocus = () => {
      loadProduction(false);
    };
    window.addEventListener('focus', handleFocus);
    const syncInterval = setInterval(() => {
      loadProduction(false);
    }, 12000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [userEmail, navigate]);

  /**
   * Fetches latest active production orders from the backend API.
   */
  const loadProduction = async (showSpinner: boolean = true) => {
    if (showSpinner) setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getProduction();
      setItems(data);
    } catch (err: unknown) {
      if (showSpinner) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch production orders';
        setErrorMessage(msg);
      }
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  /**
   * Prepares and opens the blank production order form.
   */
  const handleOpenAddForm = () => {
    setEditingId(null);
    setModelName('');
    setBrandCategory(brandFilter === 'Rakib Fashion' ? 'Rakib Fashion' : 'Rakib Silk');
    setQuantity('');
    // Default deadline to +7 days
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setEstimatedCompletionDate(d.toISOString().split('T')[0]);
    setStatus('Pending');
    setNameError(null);
    setQuantityError(null);
    setDateError(null);
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  /**
   * Populates form fields with existing order data for editing.
   */
  const handleStartEdit = (item: ProductionItem) => {
    setEditingId(item.id);
    setModelName(item.modelName || '');
    const isFashion =
      item.brandCategory === 'Rakib Fashion' || item.brandCategory?.toLowerCase().includes('fashion');
    setBrandCategory(isFashion ? 'Rakib Fashion' : 'Rakib Silk');
    setQuantity(item.quantity ? String(item.quantity) : '');
    setEstimatedCompletionDate(item.estimatedCompletionDate || '');
    setStatus(item.status || 'Pending');
    setNameError(null);
    setQuantityError(null);
    setDateError(null);
    setErrorMessage(null);
    setIsFormVisible(true);
  };

  /**
   * Cancels form mode and clears inputs.
   */
  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    setNameError(null);
    setQuantityError(null);
    setDateError(null);
  };

  /**
   * Validates form inputs and commits production batch order to MongoDB.
   */
  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nErr = validateModelName(modelName);
    const qErr = validatePositiveInteger(quantity, 'Quantity');
    let dErr: string | null = null;
    if (!estimatedCompletionDate) {
      dErr = 'Estimated completion date is required';
    }

    setNameError(nErr);
    setQuantityError(qErr);
    setDateError(dErr);

    if (nErr || qErr || dErr) {
      return;
    }

    const prodId = editingId !== null ? editingId : Date.now();
    const itemPayload: ProductionItem = {
      id: prodId,
      modelName: modelName.trim(),
      brandCategory: brandCategory || 'Rakib Silk',
      quantity: Number(quantity),
      estimatedCompletionDate: estimatedCompletionDate,
      status: status,
    };

    setIsLoading(true);
    try {
      // NOTE: POST /production expects an ARRAY of items
      await saveProductionItems([itemPayload]);
      logAction({
        module: 'Production',
        action: editingId !== null ? 'UPDATE' : 'CREATE',
        targetId: itemPayload.id,
        modelName: itemPayload.modelName,
        description:
          editingId !== null
            ? `Updated production order #${itemPayload.id} for "${itemPayload.modelName}": ${itemPayload.quantity} pcs, Due: ${itemPayload.estimatedCompletionDate}, Status: ${itemPayload.status}`
            : `Queued production order for "${itemPayload.modelName}": ${itemPayload.quantity} pcs, Due: ${itemPayload.estimatedCompletionDate}, Status: ${itemPayload.status}`,
        userEmail,
      });
      setSuccessMessage(
        editingId !== null
          ? `Production order for "${itemPayload.modelName}" updated.`
          : `Production order for "${itemPayload.modelName}" queued successfully.`
      );
      handleCancelForm();
      await loadProduction();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save production order';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates delete confirmation prompt for a specific production order.
   */
  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  /**
   * Executes deletion of a production batch order.
   */
  const handleConfirmDelete = async (id: number) => {
    const deletedItem = items.find((i) => i.id === id);
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await deleteProductionItem(id);
      logAction({
        module: 'Production',
        action: 'DELETE',
        targetId: id,
        modelName: deletedItem?.modelName || `Order #${id}`,
        description: `Removed production order #${id} (${deletedItem?.modelName || 'Batch'})`,
        userEmail,
      });
      setSuccessMessage(`Production order #${id} removed successfully.`);
      setDeleteConfirmId(null);
      await loadProduction();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to delete order #${id}`;
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Column sort toggle handler.
   */
  const handleSort = (field: ProductionSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /**
   * Dedicated metric calculations for Rakib Silk vs. Rakib Fashion weaving orders
   */
  const silkBatches = useMemo(() => {
    return items.filter(
      (i) => i.brandCategory === 'Rakib Silk' || !i.brandCategory?.toLowerCase().includes('fashion')
    );
  }, [items]);

  const fashionBatches = useMemo(() => {
    return items.filter(
      (i) => i.brandCategory === 'Rakib Fashion' || (i.brandCategory?.toLowerCase().includes('fashion'))
    );
  }, [items]);

  const silkMetrics = useMemo(() => {
    const count = silkBatches.length;
    const pieces = silkBatches.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const activeOnLooms = silkBatches.filter((i) => i.status !== 'Completed').length;
    return { count, pieces, activeOnLooms };
  }, [silkBatches]);

  const fashionMetrics = useMemo(() => {
    const count = fashionBatches.length;
    const pieces = fashionBatches.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const activeOnLooms = fashionBatches.filter((i) => i.status !== 'Completed').length;
    return { count, pieces, activeOnLooms };
  }, [fashionBatches]);

  /**
   * Memoized filtered and sorted production order list.
   */
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      // 1. Department Filter
      if (brandFilter === 'Rakib Silk') {
        const isFashion =
          item.brandCategory === 'Rakib Fashion' || item.brandCategory?.toLowerCase().includes('fashion');
        if (isFashion) return false;
      } else if (brandFilter === 'Rakib Fashion') {
        const isFashion =
          item.brandCategory === 'Rakib Fashion' || item.brandCategory?.toLowerCase().includes('fashion');
        if (!isFashion) return false;
      }

      // 2. Search & Status Filter
      const matchesSearch =
        !searchQuery.trim() ||
        item.modelName.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
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
  }, [items, searchQuery, statusFilter, brandFilter, sortField, sortOrder]);

  return (
    <div className="page-wrapper">
      <ProductionHeader
        isFormVisible={isFormVisible}
        onOpenAddForm={handleOpenAddForm}
        isLoading={isLoading}
      />

      {/* Dual Department Production Metrics Grid */}
      <div className="department-metrics-grid" style={{ marginTop: '1rem' }}>
        <div
          className={`department-metric-card silk-card ${brandFilter === 'Rakib Silk' ? 'card-selected' : ''}`}
          onClick={() => setBrandFilter(brandFilter === 'Rakib Silk' ? 'ALL' : 'Rakib Silk')}
          title="Click to filter weaving batches by Rakib Silk"
        >
          <div className="dept-header">
            <span className="dept-badge pill-gold">✨ Rakib Silk Weaving</span>
            <span className="dept-select-hint">
              {brandFilter === 'Rakib Silk' ? 'Active Filter (Click to Reset)' : 'Click to filter'}
            </span>
          </div>
          <div className="dept-stats">
            <div className="dept-stat">
              <span className="stat-label">Loom Batches:</span>
              <span className="stat-value">{silkMetrics.count} batches</span>
            </div>
            <div className="dept-stat">
              <span className="stat-label">Weaving Pieces:</span>
              <span className="stat-value text-gold">{silkMetrics.pieces} pcs</span>
            </div>
            <div className="dept-stat">
              <span className="stat-label">Active on Looms:</span>
              <span className="stat-value">{silkMetrics.activeOnLooms} active</span>
            </div>
          </div>
        </div>

        <div
          className={`department-metric-card fashion-card ${brandFilter === 'Rakib Fashion' ? 'card-selected' : ''}`}
          onClick={() => setBrandFilter(brandFilter === 'Rakib Fashion' ? 'ALL' : 'Rakib Fashion')}
          title="Click to filter weaving batches by Rakib Fashion"
        >
          <div className="dept-header">
            <span className="dept-badge pill-burgundy">🏷️ Rakib Fashion Weaving</span>
            <span className="dept-select-hint">
              {brandFilter === 'Rakib Fashion' ? 'Active Filter (Click to Reset)' : 'Click to filter'}
            </span>
          </div>
          <div className="dept-stats">
            <div className="dept-stat">
              <span className="stat-label">Loom Batches:</span>
              <span className="stat-value">{fashionMetrics.count} batches</span>
            </div>
            <div className="dept-stat">
              <span className="stat-label">Weaving Pieces:</span>
              <span className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {fashionMetrics.pieces} pcs
              </span>
            </div>
            <div className="dept-stat">
              <span className="stat-label">Active on Looms:</span>
              <span className="stat-value">{fashionMetrics.activeOnLooms} active</span>
            </div>
          </div>
        </div>
      </div>

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
            Processing production request... (Server may take ~30s on cold start)
          </span>
        </div>
      )}

      {/* Inline Form */}
      {isFormVisible && (
        <ProductionOrderForm
          editingId={editingId}
          modelName={modelName}
          onModelNameChange={(val) => {
            setModelName(val);
            if (nameError) setNameError(validateModelName(val));
          }}
          brandCategory={brandCategory}
          onBrandCategoryChange={setBrandCategory}
          quantity={quantity}
          onQuantityChange={(val) => {
            setQuantity(val);
            if (quantityError) setQuantityError(validatePositiveInteger(val, 'Quantity'));
          }}
          estimatedCompletionDate={estimatedCompletionDate}
          onEstimatedCompletionDateChange={(val) => {
            setEstimatedCompletionDate(val);
            if (dateError) setDateError(null);
          }}
          status={status}
          onStatusChange={setStatus}
          nameError={nameError}
          quantityError={quantityError}
          dateError={dateError}
          isLoading={isLoading}
          onSubmit={handleSaveProduction}
          onCancel={handleCancelForm}
        />
      )}

      {/* Table Section */}
      <div className="table-controls-card">
        <ProductionFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          brandFilter={brandFilter}
          onBrandFilterChange={setBrandFilter}
          silkBatches={silkMetrics.count}
          fashionBatches={fashionMetrics.count}
          allBatches={items.length}
          totalCount={filteredAndSortedItems.length}
        />

        <ProductionTable
          items={filteredAndSortedItems}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEditItem={handleStartEdit}
          deleteConfirmId={deleteConfirmId}
          onDeleteClick={handleDeleteClick}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          isLoading={isLoading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
};
