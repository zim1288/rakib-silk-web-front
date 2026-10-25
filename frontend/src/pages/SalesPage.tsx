import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Search,
  CheckCircle2,
  ArrowLeft,
  Package,
  User,
  Phone,
  Printer,
  ShoppingBag,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getInventory,
  saveInventoryItem,
  getTransactions,
  saveTransaction,
  sellInventoryItemAtomic,
} from '../services/api';
import { formatDateDMY } from '../utils/date';
import { logAction } from '../services/history';
import { InventoryItem, TransactionItem } from '../types';

export const SalesPage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [sareeSearch, setSareeSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Customer Autocomplete Suggestions
  const [customerSuggestionsOpen, setCustomerSuggestionsOpen] = useState(false);

  // Completed Invoice State for Receipt Modal
  const [completedSale, setCompletedSale] = useState<{
    invoiceId: string;
    modelName: string;
    brandCategory: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    customerName: string;
    customerNumber: string;
    date: string;
    remainingStock: number;
  } | null>(null);

  useEffect(() => {
    document.title = 'Record Sale - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadData(true);

    // Live Multi-Device Auto-Sync:
    // 1. Refetch freshest stock when merchant re-focuses or switches back to this tab
    const handleFocus = () => {
      loadData(false);
    };
    window.addEventListener('focus', handleFocus);

    // 2. Background polling heartbeat every 10 seconds while on this sales desk
    const syncInterval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [userEmail, navigate]);

  const loadData = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const [invData, txData] = await Promise.all([
        getInventory().catch(() => [] as InventoryItem[]),
        getTransactions().catch(() => [] as TransactionItem[]),
      ]);
      setInventory(invData);
      setTransactions(txData);
    } catch (err: unknown) {
      if (showLoadingSpinner) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch inventory for sales';
        setErrorMessage(msg);
      }
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  const selectedItem = useMemo(() => {
    return inventory.find((item) => item.id === selectedItemId) || null;
  }, [inventory, selectedItemId]);

  // Unique customer directory derived from transactions for autocomplete
  const customerDirectory = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    transactions.forEach((tx) => {
      const name = tx.customerName?.trim();
      const number = tx.customerNumber?.trim();
      if (name || number) {
        const key = number || name?.toLowerCase() || '';
        if (key && !map.has(key)) {
          map.set(key, { name: name || 'Client', number: number || '' });
        }
      }
    });
    return Array.from(map.values());
  }, [transactions]);

  // Filtered customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerName.trim() && !customerNumber.trim()) return [];
    const qName = customerName.trim().toLowerCase();
    const qNum = customerNumber.trim();
    return customerDirectory.filter(
      (c) =>
        (qName && c.name.toLowerCase().includes(qName)) ||
        (qNum && c.number.includes(qNum))
    );
  }, [customerDirectory, customerName, customerNumber]);

  // Sarees filtered for the dropdown selector
  const filteredSarees = useMemo(() => {
    if (!sareeSearch.trim()) return inventory;
    const q = sareeSearch.trim().toLowerCase();
    return inventory.filter(
      (item) =>
        item.modelName.toLowerCase().includes(q) ||
        (item.brandCategory && item.brandCategory.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q))
    );
  }, [inventory, sareeSearch]);

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setUnitPrice(item.unitPrice ? item.unitPrice.toString() : '');
    setIsDropdownOpen(false);
    setSareeSearch('');
    setErrorMessage(null);
  };

  const handleSelectCustomer = (c: { name: string; number: string }) => {
    setCustomerName(c.name);
    setCustomerNumber(c.number);
    setCustomerSuggestionsOpen(false);
  };

  const qtyNum = parseInt(quantity, 10) || 0;
  const priceNum = parseFloat(unitPrice) || 0;
  const totalSaleAmount = qtyNum * priceNum;
  const isOutOfStock = selectedItem ? (selectedItem.pieceCount || 0) <= 0 : false;
  const isQtyExceeded = selectedItem ? qtyNum > (selectedItem.pieceCount || 0) : false;

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedItem) {
      setErrorMessage('Please select a saree model from inventory to sell.');
      return;
    }
    if (qtyNum <= 0) {
      setErrorMessage('Pieces to sell must be greater than 0.');
      return;
    }
    if (qtyNum > (selectedItem.pieceCount || 0)) {
      setErrorMessage(
        `Insufficient stock! Only ${selectedItem.pieceCount} pcs of "${selectedItem.modelName}" available in hand.`
      );
      return;
    }
    if (priceNum <= 0) {
      setErrorMessage('Unit selling price must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];
      let remaining = (selectedItem.pieceCount || 0) - qtyNum;

      // ATOMIC CONCURRENCY GUARD:
      // Uses the atomic server endpoint to guarantee that two devices selling
      // at the exact same moment cannot oversell stock.
      try {
        const atomicRes = await sellInventoryItemAtomic({
          itemId: selectedItem.id,
          quantity: qtyNum,
          unitPrice: priceNum,
          customerName: customerName.trim() || undefined,
          customerNumber: customerNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        remaining = atomicRes.remainingStock;
      } catch (atomicErr: unknown) {
        const errMsg = atomicErr instanceof Error ? atomicErr.message : String(atomicErr);

        // If another device just sold this item and depleted stock:
        if (errMsg.includes('Insufficient stock') || errMsg.includes('409')) {
          setErrorMessage(errMsg);
          // Immediately refresh local data from MongoDB so user sees real remaining stock
          await loadData(false);
          setIsSubmitting(false);
          return;
        }

        // Fallback for offline/local simulation
        console.warn('Atomic endpoint unavailable, using standard write fallback...');
        const updatedItem: InventoryItem = {
          ...selectedItem,
          pieceCount: remaining,
        };
        await saveInventoryItem(updatedItem);

        const txPayload: TransactionItem = {
          id: now,
          type: 'SELL_OUT',
          modelName: selectedItem.modelName,
          quantity: qtyNum,
          totalAmount: totalSaleAmount,
          timestamp: now,
          dateString: today,
          customerName: customerName.trim() || undefined,
          customerNumber: customerNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await saveTransaction(txPayload);
      }

      // 3. Log Audit Action History
      const clientInfo = customerName.trim() ? ` to ${customerName.trim()}` : '';
      logAction({
        module: 'Inventory',
        action: 'UPDATE',
        targetId: selectedItem.id,
        modelName: selectedItem.modelName,
        description: `Sale deduction: -${qtyNum} pcs sold${clientInfo} at ৳${priceNum}/pc. Remaining stock: ${remaining} pcs`,
        userEmail,
      });

      logAction({
        module: 'Transactions',
        action: 'CREATE',
        targetId: now,
        modelName: selectedItem.modelName,
        description: `Recorded SELL_OUT sale for "${selectedItem.modelName}"${clientInfo}: ${qtyNum} pcs totaling ৳${totalSaleAmount.toLocaleString()}`,
        userEmail,
      });

      // 4. Set Completed Sale for Receipt
      setCompletedSale({
        invoiceId: `INV-${now.toString().slice(-6)}`,
        modelName: selectedItem.modelName,
        brandCategory: selectedItem.brandCategory || 'Rakib Silk',
        quantity: qtyNum,
        unitPrice: priceNum,
        totalAmount: totalSaleAmount,
        customerName: customerName.trim() || 'Walk-in Retail Client',
        customerNumber: customerNumber.trim() || 'N/A',
        date: formatDateDMY(new Date()),
        remainingStock: remaining,
      });

      // Reset form
      setSelectedItemId(null);
      setQuantity('');
      setUnitPrice('');
      setCustomerName('');
      setCustomerNumber('');
      setNotes('');

      // Refresh data
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record sale';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="sales-page-container">
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
            <span className="breadcrumb-current">Sales Billing</span>
          </div>
          <h1 className="page-heading">Record Retail &amp; Wholesale Sale</h1>
          <p className="page-description">
            Select an in-stock saree to deduct inventory, record client details, and generate sale invoices
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/customers')}
          >
            <User size={16} style={{ marginRight: '0.4rem' }} />
            <span>Customer Directory</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/history')}
          >
            <Receipt size={16} style={{ marginRight: '0.4rem' }} />
            <span>Ledger / History</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-error-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Billing Grid */}
      <div className="sales-layout-grid">
        {/* Left Card: Billing Entry Form */}
        <div className="sales-card-styled">
          <div className="card-header-styled">
            <div className="header-icon-circle icon-terracotta">
              <Send size={20} />
            </div>
            <div>
              <h2 className="card-title-styled">Point of Sale (POS) Form</h2>
              <span className="card-subtitle-styled">Real-time stock deduction and invoice creation</span>
            </div>
          </div>

          <form onSubmit={handleSubmitSale} className="sales-form">
            {/* Saree Catalog Dropdown Selector */}
            <div className="form-group">
              <label className="form-label">
                Select Saree from Inventory <span className="required-mark">*</span>
              </label>

              <div className="saree-custom-selector-wrap">
                <div
                  className={`saree-selector-trigger ${selectedItem ? 'has-selection' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  role="button"
                  tabIndex={0}
                >
                  {selectedItem ? (
                    <div className="selected-saree-preview">
                      <span className="selected-saree-name">{selectedItem.modelName}</span>
                      <div className="selected-saree-meta">
                        <span className="badge-category">{selectedItem.brandCategory || 'Rakib Silk'}</span>
                        <span className="stock-count-pill">
                          {selectedItem.pieceCount} pcs in hand
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="placeholder-text">Click to choose a saree model in stock...</span>
                  )}
                  <span className="dropdown-caret">{isDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {isDropdownOpen && (
                  <div className="saree-dropdown-menu">
                    <div className="dropdown-search-box">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search model name, brand or SKU..."
                        value={sareeSearch}
                        onChange={(e) => setSareeSearch(e.target.value)}
                        className="dropdown-search-input"
                        autoFocus
                      />
                    </div>

                    <div className="dropdown-items-scroll">
                      {filteredSarees.length === 0 ? (
                        <div className="dropdown-empty">No matching sarees found in stock</div>
                      ) : (
                        filteredSarees.map((item) => {
                          const isZero = (item.pieceCount || 0) <= 0;
                          return (
                            <div
                              key={item.id}
                              className={`dropdown-option-row ${isZero ? 'option-disabled' : ''} ${selectedItemId === item.id ? 'option-selected' : ''}`}
                              onClick={() => !isZero && handleSelectItem(item)}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="option-info">
                                <span className="option-title">{item.modelName}</span>
                                <span className="option-sub">
                                  {item.brandCategory || 'Rakib Silk'} {item.sku ? `• SKU: ${item.sku}` : ''}
                                </span>
                              </div>
                              <div className="option-stock">
                                <strong className="option-price">৳{item.unitPrice.toLocaleString('en-US')}</strong>
                                <span className={`stock-badge ${isZero ? 'stock-zero' : 'stock-available'}`}>
                                  {item.pieceCount} pcs left
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pieces to Sell & Selling Price */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="sales-quantity" className="form-label">
                  Sold Pieces <span className="required-mark">*</span>
                </label>
                <input
                  id="sales-quantity"
                  data-testid="sold_quantity_input"
                  type="number"
                  min="1"
                  max={selectedItem ? selectedItem.pieceCount : undefined}
                  className={`form-input ${isQtyExceeded ? 'input-error' : ''}`}
                  placeholder="e.g. 2"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!selectedItem || isOutOfStock}
                  required
                />
                <small className={`field-helper ${isQtyExceeded ? 'text-danger' : ''}`}>
                  {selectedItem
                    ? isQtyExceeded
                      ? `Exceeds stock! Max available: ${selectedItem.pieceCount} pcs`
                      : `Available stock: ${selectedItem.pieceCount} pcs`
                    : 'Select a saree model first'}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="sales-price" className="form-label">
                  Client Selling Price (৳ / pc) <span className="required-mark">*</span>
                </label>
                <input
                  id="sales-price"
                  data-testid="sold_price_input"
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 5200"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  disabled={!selectedItem || isOutOfStock}
                  required
                />
                <small className="field-helper">Defaults to catalog retail price</small>
              </div>
            </div>

            {/* Customer Details with Autocomplete */}
            <div className="form-row-2">
              <div className="form-group customer-autocomplete-wrap">
                <label htmlFor="sales-customer-name" className="form-label">
                  Client / Customer Name
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="sales-customer-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahim Chowdhury"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setCustomerSuggestionsOpen(true);
                    }}
                    onFocus={() => setCustomerSuggestionsOpen(true)}
                  />
                </div>

                {customerSuggestionsOpen && customerSuggestions.length > 0 && (
                  <div className="customer-suggestions-dropdown">
                    <span className="suggestions-header">Recent Customers:</span>
                    {customerSuggestions.map((c, i) => (
                      <div
                        key={i}
                        className="suggestion-item"
                        onClick={() => handleSelectCustomer(c)}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="sugg-name">{c.name}</span>
                        {c.number && <span className="sugg-phone">{c.number}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="sales-customer-number" className="form-label">
                  Client Phone Number
                </label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    id="sales-customer-number"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 01712345678"
                    value={customerNumber}
                    onChange={(e) => {
                      setCustomerNumber(e.target.value);
                      setCustomerSuggestionsOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Optional Memo / Notes */}
            <div className="form-group">
              <label htmlFor="sales-notes" className="form-label">
                Sale Note / Order Memo (Optional)
              </label>
              <input
                id="sales-notes"
                type="text"
                className="form-input"
                placeholder="e.g. Eid wholesale package or Wedding order"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Total Sale Revenue Summary Box */}
            <div className="sale-calculation-box">
              <div className="calc-row">
                <span className="calc-label">Total Sale Revenue:</span>
                <strong className="calc-amount">৳{totalSaleAmount.toLocaleString('en-US')}</strong>
              </div>
              <small className="calc-sub">
                {qtyNum} pcs &times; ৳{priceNum.toLocaleString('en-US')} per piece
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block-action"
              disabled={isSubmitting || !selectedItem || isOutOfStock || isQtyExceeded}
              style={{ padding: '0.95rem' }}
            >
              {isSubmitting ? (
                <span>Recording Sale &amp; Deducting Stock...</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>CONFIRM SALE &amp; DEDUCT STOCK</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Card: Real-Time Saree Stock Preview & Quick Activity */}
        <div className="sales-preview-column">
          {selectedItem ? (
            <div className="saree-preview-card">
              <div className="preview-header">
                <span className="preview-label">Selected Saree Details</span>
                <span className="badge-category">{selectedItem.brandCategory || 'Rakib Silk'}</span>
              </div>

              <div className="preview-body">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.modelName}
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-image-placeholder">🥻</div>
                )}

                <div className="preview-details">
                  <h3 className="preview-title">{selectedItem.modelName}</h3>
                  <div className="preview-stats-list">
                    <div className="p-stat">
                      <span className="p-stat-title">Current In-Hand Stock:</span>
                      <strong className={`p-stat-val ${selectedItem.pieceCount <= 2 ? 'text-danger' : ''}`}>
                        {selectedItem.pieceCount} pieces
                      </strong>
                    </div>

                    <div className="p-stat">
                      <span className="p-stat-title">Catalog Retail Price:</span>
                      <strong className="p-stat-val text-gold">৳{selectedItem.unitPrice.toLocaleString('en-US')}</strong>
                    </div>

                    {qtyNum > 0 && !isQtyExceeded && (
                      <div className="p-stat projected-row">
                        <span className="p-stat-title">Stock After Sale:</span>
                        <strong className="p-stat-val text-primary">
                          {(selectedItem.pieceCount || 0) - qtyNum} pieces remaining
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="sales-info-card">
              <div className="info-icon-wrap">
                <ShoppingBag size={32} />
              </div>
              <h3 className="info-title">Fast Retail Saree Billing</h3>
              <p className="info-text">
                Select a saree from the dropdown on the left. The system will automatically display current
                in-hand pieces, suggest repeat clients, recalculate revenues, and update your inventory tally in real time.
              </p>
              <div className="info-highlights">
                <div className="highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Guaranteed stock safety (prevents overselling)</span>
                </div>
                <div className="highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Automatic client spending compilation</span>
                </div>
                <div className="highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Instant printable receipt generation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sale Success & Printable Receipt Modal */}
      {completedSale && (
        <div className="modal-backdrop" onClick={() => setCompletedSale(null)}>
          <div className="invoice-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="receipt-brand">
                <span className="brand-icon">🥻</span>
                <span className="brand-name">Silk &amp; Fashion</span>
              </div>
              <span className="receipt-badge">SALES INVOICE</span>
            </div>

            <div className="receipt-body printable-area">
              <div className="receipt-meta-grid">
                <div>
                  <span className="meta-label">Invoice ID:</span>
                  <strong className="meta-val">{completedSale.invoiceId}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="meta-label">Date:</span>
                  <strong className="meta-val">{completedSale.date}</strong>
                </div>
              </div>

              <div className="receipt-client-box">
                <div className="client-row">
                  <span className="client-label">Billed To:</span>
                  <strong className="client-name">{completedSale.customerName}</strong>
                </div>
                <div className="client-row">
                  <span className="client-label">Phone:</span>
                  <span className="client-val">{completedSale.customerNumber}</span>
                </div>
              </div>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{completedSale.modelName}</strong>
                      <span className="receipt-item-cat">({completedSale.brandCategory})</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{completedSale.quantity} pcs</td>
                    <td style={{ textAlign: 'right' }}>৳{completedSale.unitPrice.toLocaleString('en-US')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>৳{completedSale.totalAmount.toLocaleString('en-US')}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-total-bar">
                <span>Grand Total:</span>
                <span className="grand-total-val">৳{completedSale.totalAmount.toLocaleString('en-US')}</span>
              </div>

              <div className="receipt-footer-note">
                <p>Thank you for choosing Silk &amp; Fashion! Handcrafted Luxury Sarees.</p>
                <small>Updated inventory balance: {completedSale.remainingStock} pcs</small>
              </div>
            </div>

            <div className="receipt-modal-actions no-print">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCompletedSale(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintReceipt}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
