import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Tag,
  Palette,
  Check,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, saveInventoryItem, saveTransaction } from '../services/api';
import { logAction } from '../services/history';
import { InventoryItem, PurchaseCartItem, TransactionItem } from '../types';

const CART_STORAGE_KEY = 'rakib_purchase_staging_cart';

export const PurchasePage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  // Current House Stock (to detect existing items and update pieceCount)
  const [houseInventory, setHouseInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  // Cart State (initialized from localStorage)
  const [cart, setCart] = useState<PurchaseCartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Form Inputs
  const [modelName, setModelName] = useState('');
  const [brandCategory, setBrandCategory] = useState<'Rakib Silk' | 'Rakib Fashion'>('Rakib Silk');
  const [unitCost, setUnitCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sku, setSku] = useState('');
  const [color, setColor] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressedDataUrl);
        } else {
          setImageUrl(result);
        }
      };
      img.onerror = () => {
        setImageUrl(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Form Validation & Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<{
    totalItems: number;
    totalPieces: number;
    totalAmount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Purchase Product - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadHouseInventory();

    const handleFocus = () => {
      loadHouseInventory();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userEmail, navigate]);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const loadHouseInventory = async () => {
    setIsLoadingInventory(true);
    try {
      const data = await getInventory();
      setHouseInventory(data);
    } catch (err: unknown) {
      console.warn('Could not prefetch inventory for autocomplete:', err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Quick auto-fill if user types an existing catalog model name
  const handleModelNameChange = (val: string) => {
    setModelName(val);
    setFormError(null);
    const existing = houseInventory.find(
      (item) => item.modelName.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (existing) {
      if (existing.brandCategory === 'Rakib Silk' || existing.brandCategory === 'Rakib Fashion') {
        setBrandCategory(existing.brandCategory);
      }
      if (existing.unitPrice && !unitCost) {
        setUnitCost(existing.unitPrice.toString());
      }
      if (existing.imageUrl && !imageUrl) {
        setImageUrl(existing.imageUrl);
      }
      if (existing.sku && !sku) {
        setSku(existing.sku);
      }
      if (existing.color && !color) {
        setColor(existing.color);
      }
      if (existing.fabricType && !fabricType) {
        setFabricType(existing.fabricType);
      }
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCommitSuccess(null);

    const trimmedName = modelName.trim();
    const parsedCost = parseFloat(unitCost);
    const parsedQty = parseInt(quantity, 10);

    if (!trimmedName) {
      setFormError('Model name is required.');
      return;
    }
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setFormError('Unit cost must be a valid number greater than 0.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('Pieces count must be a whole number greater than 0.');
      return;
    }

    const newItem: PurchaseCartItem = {
      id: `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      modelName: trimmedName,
      brandCategory,
      unitCost: parsedCost,
      quantity: parsedQty,
      sku: sku.trim() || undefined,
      color: color.trim() || undefined,
      fabricType: fabricType.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    setCart((prev) => [newItem, ...prev]);

    // Reset inputs
    setModelName('');
    setUnitCost('');
    setQuantity('');
    setSku('');
    setColor('');
    setFabricType('');
    setImageUrl('');
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items from the purchase cart?')) {
      setCart([]);
      setCommitSuccess(null);
    }
  };

  // Commit Staging Cart to Stock
  const handleCommitCartToStock = async () => {
    if (cart.length === 0) return;

    setIsCommitting(true);
    setErrorMessage(null);
    setCommitSuccess(null);

    try {
      // Re-fetch latest inventory to ensure consistency
      const currentInventory = await getInventory().catch(() => houseInventory);

      let totalPieces = 0;
      let totalAmount = 0;
      const today = new Date().toISOString().split('T')[0];

      for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i];
        const costTotal = cartItem.unitCost * cartItem.quantity;
        totalPieces += cartItem.quantity;
        totalAmount += costTotal;

        // Check if item exists in present house inventory
        const existing = currentInventory.find(
          (item) =>
            item.modelName.trim().toLowerCase() === cartItem.modelName.trim().toLowerCase() &&
            (item.brandCategory || 'Rakib Silk') === cartItem.brandCategory
        );

        if (existing) {
          // Update pieces and unit price
          const updated: InventoryItem = {
            ...existing,
            pieceCount: (Number(existing.pieceCount) || 0) + cartItem.quantity,
            unitPrice: cartItem.unitCost, // Update to latest purchase cost
            imageUrl: cartItem.imageUrl || existing.imageUrl,
            sku: cartItem.sku || existing.sku,
            color: cartItem.color || existing.color,
            fabricType: cartItem.fabricType || existing.fabricType,
          };
          await saveInventoryItem(updated);

          logAction({
            module: 'Inventory',
            action: 'UPDATE',
            targetId: updated.id,
            modelName: updated.modelName,
            description: `Cargo stock inward: +${cartItem.quantity} pcs added (New Total: ${updated.pieceCount} pcs at ৳${updated.unitPrice})`,
            userEmail,
          });
        } else {
          // Insert new saree item
          const newId = Date.now() + i;
          const newItem: InventoryItem = {
            id: newId,
            modelName: cartItem.modelName,
            brandCategory: cartItem.brandCategory,
            unitPrice: cartItem.unitCost,
            pieceCount: cartItem.quantity,
            imageUrl: cartItem.imageUrl,
            sku: cartItem.sku,
            color: cartItem.color,
            fabricType: cartItem.fabricType,
          };
          await saveInventoryItem(newItem);

          logAction({
            module: 'Inventory',
            action: 'CREATE',
            targetId: newId,
            modelName: newItem.modelName,
            description: `New catalog item created via Cargo purchase: ${newItem.pieceCount} pcs at ৳${newItem.unitPrice} (${newItem.brandCategory})`,
            userEmail,
          });
        }

        // Log permanent Expense / Purchase Transaction
        const txPayload: TransactionItem = {
          id: Date.now() + 100 + i,
          type: 'PURCHASE_IN',
          modelName: cartItem.modelName,
          quantity: cartItem.quantity,
          totalAmount: costTotal,
          timestamp: Date.now(),
          dateString: today,
          notes: `Cargo Shipment Inward - ${cartItem.brandCategory}`,
        };
        await saveTransaction(txPayload);

        logAction({
          module: 'Transactions',
          action: 'CREATE',
          targetId: txPayload.id,
          modelName: txPayload.modelName,
          description: `Logged PURCHASE_IN transaction for "${txPayload.modelName}": ${txPayload.quantity} pcs totaling ৳${txPayload.totalAmount.toLocaleString()}`,
          userEmail,
        });
      }

      setCommitSuccess({
        totalItems: cart.length,
        totalPieces,
        totalAmount,
      });

      // Clear Cart
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);

      // Refresh local house inventory state
      loadHouseInventory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to commit cargo to stock';
      setErrorMessage(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const cartTotalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="purchase-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="header-breadcrumbs">
            <button
              type="button"
              className="back-to-dashboard-btn"
              onClick={() => navigate('/')}
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Purchase Product</span>
          </div>
          <h1 className="page-heading">Stage Incoming Cargo Shipments</h1>
          <p className="page-description">
            Build bulk purchase cart, verify shipment details, then commit stock directly into house inventory
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/inventory')}
          >
            <Package size={16} style={{ marginRight: '0.4rem' }} />
            <span>View House Stock</span>
          </button>
        </div>
      </div>

      {errorMessage && <div className="alert-error-box">{errorMessage}</div>}

      {/* Commit Success Celebration Banner */}
      {commitSuccess && (
        <div className="purchase-success-banner">
          <div className="success-banner-icon">
            <CheckCircle2 size={32} />
          </div>
          <div className="success-banner-content">
            <h3 className="success-banner-title">Shipment Committed Successfully!</h3>
            <p className="success-banner-desc">
              <strong>{commitSuccess.totalPieces} pieces</strong> across{' '}
              <strong>{commitSuccess.totalItems} models</strong> (totaling{' '}
              <strong>৳{commitSuccess.totalAmount.toLocaleString('en-US')}</strong>) were inwarded into
              House Stock and logged into Transactions ledger.
            </p>
            <div className="success-banner-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/inventory')}
              >
                Inspect Inventory Catalog &rarr;
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCommitSuccess(null)}
              >
                Stage Another Cargo Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace Grid */}
      <div className="purchase-workspace-grid">
        {/* Left Column: Intake Entry Form */}
        <div className="purchase-form-card">
          <div className="card-header-styled">
            <div className="header-icon-circle icon-sage">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="card-title-styled">Stage Saree Cargo Item</h2>
              <span className="card-subtitle-styled">Enter details of incoming stock from suppliers</span>
            </div>
          </div>

          <form onSubmit={handleAddToCart} className="purchase-form">
            {formError && (
              <div className="form-alert-error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Model Name with Datalist Autocomplete */}
            <div className="form-group">
              <label htmlFor="purchase-model-name" className="form-label">
                Model Saree Description <span className="required-mark">*</span>
              </label>
              <input
                id="purchase-model-name"
                data-testid="purchase-model-name"
                type="text"
                list="existing-models-list"
                className="form-input"
                placeholder="e.g. Jamdani Zari Festive or Katan Silk"
                value={modelName}
                onChange={(e) => handleModelNameChange(e.target.value)}
                required
              />
              <datalist id="existing-models-list">
                {houseInventory.map((item) => (
                  <option key={item.id} value={item.modelName} />
                ))}
              </datalist>
              <small className="field-helper">
                Type an existing model to auto-fill category, or enter a new saree design
              </small>
            </div>

            {/* Brand Category Toggle */}
            <div className="form-group">
              <label className="form-label">Class Brand Category</label>
              <div className="brand-toggle-group">
                <button
                  type="button"
                  className={`brand-toggle-btn ${brandCategory === 'Rakib Silk' ? 'active-silk' : ''}`}
                  onClick={() => setBrandCategory('Rakib Silk')}
                >
                  <Sparkles size={14} />
                  <span>Rakib Silk</span>
                </button>
                <button
                  type="button"
                  className={`brand-toggle-btn ${brandCategory === 'Rakib Fashion' ? 'active-fashion' : ''}`}
                  onClick={() => setBrandCategory('Rakib Fashion')}
                >
                  <Tag size={14} />
                  <span>Rakib Fashion</span>
                </button>
              </div>
            </div>

            {/* Pricing & Quantity Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="purchase-unit-cost" className="form-label">
                  Unit Cost (BDT ৳) <span className="required-mark">*</span>
                </label>
                <input
                  id="purchase-unit-cost"
                  data-testid="purchase-unit-cost"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 4500"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  required
                />
                <small className="field-helper">Wholesale cost per saree</small>
              </div>

              <div className="form-group">
                <label htmlFor="purchase-quantity" className="form-label">
                  Pieces Count <span className="required-mark">*</span>
                </label>
                <input
                  id="purchase-quantity"
                  data-testid="purchase-quantity"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 20"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <small className="field-helper">Incoming batch count</small>
              </div>
            </div>

            {/* SKU and Color Row */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="purchase-sku" className="form-label">
                  SKU Code (Optional)
                </label>
                <input
                  id="purchase-sku"
                  data-testid="purchase-sku"
                  type="text"
                  className="form-input"
                  placeholder="e.g. RS-JAM-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchase-color" className="form-label">
                  Color / Shade (Optional)
                </label>
                <input
                  id="purchase-color"
                  data-testid="purchase-color"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Royal Red &amp; Gold"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

            {/* Fabric Type */}
            <div className="form-group">
              <label htmlFor="purchase-fabric" className="form-label">
                Fabric Type (Optional)
              </label>
              <input
                id="purchase-fabric"
                data-testid="purchase-fabric"
                type="text"
                className="form-input"
                placeholder="e.g. Pure Mulberry Silk, Jamdani Cotton, Katan"
                value={fabricType}
                onChange={(e) => setFabricType(e.target.value)}
              />
            </div>

            {/* Saree Photo Attachment (Device File or Web URL) */}
            <div className="cool-photo-uploader-card">
              <div className="cool-photo-header">
                <div className="cool-photo-header-left">
                  <span className="cool-photo-icon">📷</span>
                  <span className="cool-photo-title">Saree Photo Attachment</span>
                  <span className="cool-photo-badge">Optional</span>
                </div>
                <span className="cool-photo-subtitle">Device photo or direct image web URL</span>
              </div>

              <div className="cool-photo-inputs-row">
                {/* Device Upload Column */}
                <div className="cool-photo-col cool-photo-device-col">
                  <label className="cool-photo-col-label">From Local Device / Camera</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDeviceImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="purchase-file-upload"
                  />
                  <button
                    type="button"
                    className="cool-photo-btn-device"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCommitting}
                  >
                    <Upload size={17} />
                    <span>Select Photo from Device</span>
                  </button>
                  <span className="cool-photo-help">Phone gallery, camera, or PC file</span>
                </div>

                {/* OR Separator */}
                <div className="cool-photo-or-col">
                  <span className="cool-photo-or-pill">OR</span>
                </div>

                {/* URL Column */}
                <div className="cool-photo-col cool-photo-url-col">
                  <label htmlFor="purchase-image" className="cool-photo-col-label">
                    Paste Image Web URL
                  </label>
                  <input
                    id="purchase-image"
                    data-testid="purchase-image"
                    type="url"
                    className="form-input cool-photo-url-input"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isCommitting}
                  />
                  <span className="cool-photo-help">Direct public image link (.jpg, .png, etc.)</span>
                </div>
              </div>

              {/* Live Preview Bar if Image Selected */}
              {imageUrl && (
                <div className="cool-photo-preview-bar">
                  <img
                    src={imageUrl}
                    alt="Saree Cargo Preview"
                    className="cool-photo-preview-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥻</text></svg>';
                    }}
                  />
                  <div className="cool-photo-preview-meta">
                    <span className="cool-photo-status-ready">
                      <Check size={14} /> ✓ Photo Attached &amp; Ready for Cargo Cart
                    </span>
                    <span className="cool-photo-preview-hint">
                      Will be saved with this saree design upon adding to cart
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cool-photo-btn-remove"
                    onClick={() => {
                      setImageUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="Remove current photo"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>

            <button
              id="add-to-cart-btn"
              data-testid="add_to_cart_button"
              type="submit"
              className="btn btn-primary btn-block-action"
            >
              <Plus size={18} />
              <span>STAGE ITEM INTO SHIPMENT CART</span>
            </button>
          </form>
        </div>

        {/* Right Column: Staging Cart Ledger */}
        <div className="purchase-cart-card">
          <div className="cart-card-header">
            <div>
              <h2 className="card-title-styled">Bulk Cargo Staging Cart</h2>
              <span className="cart-count-badge">{cart.length} items staged</span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                className="btn-clear-cart"
                onClick={handleClearCart}
                title="Empty the staging cart"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-state-icon-box">
                <ShoppingCart size={36} />
              </div>
              <h3 className="empty-cart-title">Your Bulk Shipment Log is Empty</h3>
              <p className="empty-cart-desc">
                Fill the form on the left to add items to this temporary cargo manifest. When ready, commit all items
                at once into live inventory.
              </p>
            </div>
          ) : (
            <div className="staged-cart-items-wrap">
              <div className="staged-items-list">
                {cart.map((item, index) => {
                  const lineTotal = item.unitCost * item.quantity;
                  return (
                    <div key={item.id} className="staged-cart-item">
                      <div className="item-left-block">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.modelName} className="item-thumbnail" />
                        ) : (
                          <div className="item-thumbnail-placeholder">🥻</div>
                        )}

                        <div className="item-meta-block">
                          <h4 className="item-name">{item.modelName}</h4>
                          <div className="item-pill-row">
                            <span
                              className={`brand-pill ${item.brandCategory === 'Rakib Silk' ? 'pill-gold' : 'pill-burgundy'}`}
                            >
                              {item.brandCategory}
                            </span>
                            {item.sku && <span className="attr-pill">SKU: {item.sku}</span>}
                            {item.color && <span className="attr-pill">{item.color}</span>}
                            {item.fabricType && <span className="attr-pill">{item.fabricType}</span>}
                          </div>
                          <span className="item-pricing-detail">
                            Cost: <strong>৳{item.unitCost.toLocaleString('en-US')}</strong> &times;{' '}
                            <strong>{item.quantity} pieces</strong>
                          </span>
                        </div>
                      </div>

                      <div className="item-right-block">
                        <span className="item-line-total">৳{lineTotal.toLocaleString('en-US')}</span>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => handleRemoveFromCart(item.id)}
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary & Commitment Button */}
              <div className="cart-summary-footer">
                <div className="summary-row">
                  <span className="summary-label">Total Staged Items:</span>
                  <strong className="summary-value">{cart.length} designs</strong>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Cargo Pieces:</span>
                  <strong className="summary-value">{cartTotalPieces} pcs</strong>
                </div>
                <div className="summary-row summary-grand-total">
                  <span className="grand-label">Total Inward Investment:</span>
                  <strong className="grand-amount">৳{cartTotalAmount.toLocaleString('en-US')}</strong>
                </div>

                <button
                  id="commit-stock-button"
                  data-testid="commit_stock_button"
                  type="button"
                  className="btn-commit-stock"
                  onClick={handleCommitCartToStock}
                  disabled={isCommitting}
                >
                  {isCommitting ? (
                    <>
                      <span className="spinner-sm"></span>
                      <span>Committing to House Stock...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>COMMIT ৳{cartTotalAmount.toLocaleString('en-US')} TO HOUSE STOCK</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
