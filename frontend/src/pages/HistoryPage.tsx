/**
 * HistoryPage (Financial Ledger & Operations Audit Trail)
 *
 * Primary commercial ledger and operations audit screen for Rakib Silk & Fashion:
 * - Tab 1: Financial Transaction Ledger (Revenue, Cargo Outflow, PnL, filterable table; exports in Data Export Center)
 * - Tab 2: Operations & System Audit Trail (Cross-module activity logs with real-time cross-tab sync; exports in Data Export Center)
 *
 * Modularized subcomponents are organized under `src/components/history/`.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TransactionItem, TransactionType } from '../types';
import { getTransactions, saveTransaction, getInventory, saveInventoryItem } from '../services/api';
import {
  validateModelName,
  validatePositiveNumber,
  validatePositiveInteger,
} from '../utils/validation';
import { getActionHistory, logAction, ActionHistoryEntry } from '../services/history';
import {
  LedgerMetricCards,
  LedgerFilterBar,
  LedgerTransactionForm,
  FinancialLedgerTable,
  OperationsAuditTrailTable,
  SortField,
  SortOrder,
} from '../components/history';

export const HistoryPage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active view tab: 'ledger' for commercial financial entries, 'audit' for operational logs
  const [activeTab, setActiveTab] = useState<'ledger' | 'audit'>('ledger');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [auditList, setAuditList] = useState<ActionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('dateString');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Inline "Record Commercial Transaction" Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('SELL_OUT');
  const [modelName, setModelName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dateString, setDateString] = useState(new Date().toISOString().split('T')[0]);

  // Form field errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  /**
   * Initial data load, authentication check, and cross-window sync
   */
  useEffect(() => {
    document.title = 'Ledger & History - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadData();

    // Cross-tab sync: update audit list when another tab records an action
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('rakib_audit_history_')) {
        setAuditList(getActionHistory(userEmail));
      }
    };

    // Window focus sync: reload transactions and audit trail when switching tabs
    const handleFocus = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    const syncInterval = setInterval(loadData, 12000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [userEmail, navigate]);

  /**
   * Handle route state navigation (e.g. prefilling customer or opening record modal)
   */
  useEffect(() => {
    if (location.state && (location.state as any).openAdd) {
      const st = location.state as any;
      if (st.defaultType) setType(st.defaultType);
      if (st.prefillCustomer) setCustomerName(st.prefillCustomer);
      if (st.prefillNumber) setCustomerNumber(st.prefillNumber);
      setIsFormVisible(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /**
   * Fetches latest transactions from the database and audit trail from storage
   */
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [txData, auditData] = await Promise.all([
        getTransactions(),
        Promise.resolve(getActionHistory(userEmail)),
      ]);
      setItems(txData);
      setAuditList(auditData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch ledger & history data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setType('SELL_OUT');
    setModelName('');
    setCustomerName('');
    setCustomerNumber('');
    setQuantity('');
    setTotalAmount('');
    setDateString(new Date().toISOString().split('T')[0]);
    setNameError(null);
    setQuantityError(null);
    setAmountError(null);
    setDateError(null);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setNameError(null);
    setQuantityError(null);
    setAmountError(null);
    setDateError(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /**
   * Validates inputs and persists a new commercial transaction to the database
   */
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nErr = validateModelName(modelName);
    const qErr = validatePositiveInteger(quantity, 'Pieces (Quantity)');
    const aErr = validatePositiveNumber(totalAmount, 'Total Amount');
    const dErr = !dateString ? 'Date is required.' : null;

    setNameError(nErr);
    setQuantityError(qErr);
    setAmountError(aErr);
    setDateError(dErr);

    if (nErr || qErr || aErr || dErr) return;

    setIsLoading(true);
    try {
      const parsedQuantity = parseInt(quantity, 10);
      const parsedAmount = parseFloat(totalAmount);
      const unitP = parsedQuantity > 0 ? Math.round(parsedAmount / parsedQuantity) : parsedAmount;

      const itemPayload: TransactionItem = {
        id: Date.now(),
        modelName: modelName.trim(),
        customerName: customerName.trim() || undefined,
        customerNumber: customerNumber.trim() || undefined,
        type,
        quantity: parsedQuantity,
        unitPrice: unitP,
        totalAmount: parsedAmount,
        dateString,
        timestamp: new Date(dateString).getTime() || Date.now(),
      };

      await saveTransaction(itemPayload);

      // Synchronize matching inventory item in MongoDB
      try {
        const invList = await getInventory();
        const matched = invList.find(
          (i) => i.modelName.toLowerCase() === modelName.trim().toLowerCase()
        );
        if (matched) {
          let updatedCount = matched.pieceCount || 0;
          if (type === 'SELL_OUT') {
            updatedCount = Math.max(0, updatedCount - parsedQuantity);
          } else if (type === 'PURCHASE_IN') {
            updatedCount = updatedCount + parsedQuantity;
          }
          await saveInventoryItem({ ...matched, pieceCount: updatedCount });
        }
      } catch (invSyncErr) {
        console.warn('Inventory sync skipped for transaction:', invSyncErr);
      }

      // Log to system audit trail
      const clientInfo = itemPayload.customerName ? ` for client ${itemPayload.customerName}` : '';
      logAction({
        module: 'Transactions',
        action: 'CREATE',
        targetId: String(Date.now()),
        modelName: itemPayload.modelName,
        description: `Recorded ${itemPayload.type} transaction for "${itemPayload.modelName}"${clientInfo}: ${itemPayload.quantity} pcs for ৳${itemPayload.totalAmount.toLocaleString()}`,
        userEmail,
      });

      setSuccessMessage(`Successfully logged ${type} transaction for "${modelName.trim()}".`);
      setIsFormVisible(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record transaction';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filter and sort ledger transactions in memory
   */
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by type
    if (typeFilter !== 'ALL') {
      result = result.filter((item) => item.type === typeFilter);
    }

    // Filter by month & year
    result = result.filter((item) => {
      if (!item.dateString) return true;
      const d = new Date(item.dateString);
      if (isNaN(d.getTime())) return true;

      if (monthFilter !== 'ALL' && d.getMonth() !== parseInt(monthFilter, 10)) {
        return false;
      }
      if (yearFilter !== 'ALL' && d.getFullYear() !== parseInt(yearFilter, 10)) {
        return false;
      }
      return true;
    });

    // Search query matching model, SKU, customer name, notes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.modelName.toLowerCase().includes(q) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.customerName && item.customerName.toLowerCase().includes(q)) ||
          (item.customerNumber && item.customerNumber.includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    // Sort order handling
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'dateString') {
        const aTime = a.timestamp || (a.dateString ? new Date(a.dateString).getTime() : 0);
        const bTime = b.timestamp || (b.dateString ? new Date(b.dateString).getTime() : 0);
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - (bVal || 0) : (bVal || 0) - aVal;
      }

      return 0;
    });

    return result;
  }, [items, typeFilter, monthFilter, yearFilter, searchQuery, sortField, sortOrder]);

  /**
   * Calculate top executive financial metrics
   */
  const metrics = useMemo(() => {
    let inflow = 0;
    let inflowOrders = 0;
    let outflow = 0;
    let outflowOrders = 0;

    filteredAndSortedItems.forEach((tx) => {
      const amt = tx.totalAmount || 0;
      if (tx.type === 'SELL_OUT' || tx.type === 'SALE') {
        inflow += amt;
        inflowOrders += 1;
      } else {
        outflow += amt;
        outflowOrders += 1;
      }
    });

    const netProfit = inflow - outflow;
    const margin = inflow > 0 ? ((netProfit / inflow) * 100).toFixed(1) : '0';

    return {
      inflow,
      inflowOrders,
      outflow,
      outflowOrders,
      netProfit,
      margin,
      totalCount: filteredAndSortedItems.length,
    };
  }, [filteredAndSortedItems]);

  return (
    <div className="page-wrapper">
      {/* Page Title & Actions */}
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
            <span className="breadcrumb-current">History &amp; Financial Ledger</span>
          </div>
          <h1 id="page-title" data-testid="page-title" className="page-heading">
            History &amp; Financial Ledger
          </h1>
          <p className="page-description">
            Audit saree retail sales, cargo stock purchases, loom weaving costs, and cash flow records
          </p>
        </div>
        <div className="header-actions">
          <button
            id="refresh-btn"
            data-testid="refresh-btn"
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            title="Refresh Ledger & Audit Trail"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-amber-400' : 'text-amber-400'} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {!isFormVisible && (
            <button
              id="add-transaction-btn"
              data-testid="add-transaction-btn"
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddForm}
              disabled={isLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Plus size={16} />
              <span>+ Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div id="error-msg" data-testid="error-msg" className="alert-box alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div id="success-msg" data-testid="success-msg" className="alert-box alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* DUAL TABS */}
      <div className="ledger-tabs-row">
        <button
          type="button"
          className={`ledger-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <span style={{ marginRight: '0.45rem' }}>🔥</span>
          <span>Financial Transaction Ledger ({items.length})</span>
        </button>
        <button
          type="button"
          className={`ledger-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <span style={{ marginRight: '0.45rem' }}>📋</span>
          <span>Operations &amp; System Audit Trail ({auditList.length})</span>
        </button>
      </div>

      {/* TAB 1: FINANCIAL TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <>
          {/* Executive Metric Cards */}
          <LedgerMetricCards metrics={metrics} monthFilter={monthFilter} yearFilter={yearFilter} />

          {/* Inline Add Transaction Form */}
          {isFormVisible && (
            <LedgerTransactionForm
              type={type}
              setType={setType}
              modelName={modelName}
              setModelName={setModelName}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerNumber={customerNumber}
              setCustomerNumber={setCustomerNumber}
              quantity={quantity}
              setQuantity={setQuantity}
              totalAmount={totalAmount}
              setTotalAmount={setTotalAmount}
              dateString={dateString}
              setDateString={setDateString}
              nameError={nameError}
              setNameError={setNameError}
              quantityError={quantityError}
              amountError={amountError}
              dateError={dateError}
              setDateError={setDateError}
              isLoading={isLoading}
              onSubmit={handleSaveTransaction}
              onCancel={handleCancelForm}
            />
          )}

          {/* Ledger Filter Bar */}
          <LedgerFilterBar
            monthFilter={monthFilter}
            onMonthChange={setMonthFilter}
            yearFilter={yearFilter}
            onYearChange={setYearFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultCount={filteredAndSortedItems.length}
          />

          {/* 8-Column Commercial Ledger Table */}
          <FinancialLedgerTable
            items={filteredAndSortedItems}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            searchQuery={searchQuery}
            typeFilter={typeFilter}
            monthFilter={monthFilter}
            yearFilter={yearFilter}
          />
        </>
      )}

      {/* TAB 2: OPERATIONS & SYSTEM AUDIT TRAIL */}
      {activeTab === 'audit' && <OperationsAuditTrailTable auditList={auditList} />}
    </div>
  );
};
export default HistoryPage;
