import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Phone,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  User,
  PlusCircle,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, updateCustomer } from '../services/api';
import { TransactionItem, CustomerProfile } from '../types';
import { CustomerFiltersBar, CustomerSortOption } from '../components/customers/CustomerFiltersBar';
import { CustomerEditModal } from '../components/customers/CustomerEditModal';

export const CustomerDirectoryPage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters and Sorting
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [sortBy, setSortBy] = useState<CustomerSortOption>('Newest');

  // Selected customer for detail drawer/modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Edit contact info state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Customer Directory - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadData();
  }, [userEmail, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch transaction logs for customers';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Group all transactions by customer identifier (unfiltered) for accurate KPI counts
  const allCustomerProfiles = useMemo(() => {
    const customerMap = new Map<string, CustomerProfile>();

    transactions.forEach((tx) => {
      const name = tx.customerName?.trim();
      const phone = tx.customerNumber?.trim();

      if (!name && !phone) return;

      const identifier = phone || name?.toLowerCase() || `client-${tx.id}`;
      const displayName = name || 'Anonymous Client';
      const displayNumber = phone || 'No phone recorded';

      if (!customerMap.has(identifier)) {
        customerMap.set(identifier, {
          id: identifier,
          name: displayName,
          number: displayNumber,
          totalSpent: 0,
          purchaseCount: 0,
          lastPurchaseDate: tx.dateString || 'Unknown',
          transactions: [],
        });
      }

      const prof = customerMap.get(identifier)!;
      prof.totalSpent += Number(tx.totalAmount) || 0;
      prof.purchaseCount += 1;
      prof.transactions.push(tx);

      if (name && prof.name === 'Anonymous Client') prof.name = name;
      if (phone && prof.number === 'No phone recorded') prof.number = phone;

      if (tx.timestamp && (!prof.transactions[0] || tx.timestamp > (prof.transactions[0].timestamp || 0))) {
        prof.lastPurchaseDate = tx.dateString;
      }
    });

    return Array.from(customerMap.values());
  }, [transactions]);

  // Executive KPI summary metrics
  const metrics = useMemo(() => {
    const totalClients = allCustomerProfiles.length;
    const totalRevenue = allCustomerProfiles.reduce((acc, c) => acc + c.totalSpent, 0);
    const sortedBySpent = [...allCustomerProfiles].sort((a, b) => b.totalSpent - a.totalSpent);
    const topVip = sortedBySpent[0]?.name || 'None';

    return { totalClients, totalRevenue, topVip };
  }, [allCustomerProfiles]);

  // Filtered and sorted customer profiles for the card grid
  const customers = useMemo(() => {
    let list = [...allCustomerProfiles];

    if (searchName.trim()) {
      const query = searchName.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(query));
    }

    if (searchPhone.trim()) {
      const query = searchPhone.trim();
      list = list.filter((c) => c.number.includes(query));
    }

    list.sort((a, b) => {
      if (sortBy === 'A-Z') return a.name.localeCompare(b.name);
      if (sortBy === 'Highest Spent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'Oldest') return a.lastPurchaseDate.localeCompare(b.lastPurchaseDate);
      return b.lastPurchaseDate.localeCompare(a.lastPurchaseDate);
    });

    return list;
  }, [allCustomerProfiles, searchName, searchPhone, sortBy]);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  const handleStartEditContact = (customer: CustomerProfile) => {
    setEditName(customer.name === 'Anonymous Client' ? '' : customer.name);
    setEditPhone(customer.number === 'No phone recorded' ? '' : customer.number);
    setEditError(null);
    setEditSuccessMsg(null);
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!selectedCustomer) return;
    const cleanName = editName.trim();
    const cleanPhone = editPhone.trim();

    if (!cleanName && !cleanPhone) {
      setEditError('Please enter at least a customer name or phone number.');
      return;
    }

    setIsSavingContact(true);
    setEditError(null);
    setEditSuccessMsg(null);

    const oldName = selectedCustomer.name === 'Anonymous Client' ? '' : selectedCustomer.name;
    const oldNumber = selectedCustomer.number === 'No phone recorded' ? '' : selectedCustomer.number;

    try {
      await updateCustomer(oldName, oldNumber, cleanName, cleanPhone);

      // Synchronize in local transactions state
      setTransactions((prev) =>
        prev.map((tx) => {
          const matchesOldNumber = oldNumber && tx.customerNumber === oldNumber;
          const matchesOldName = oldName && tx.customerName?.toLowerCase() === oldName.toLowerCase();
          if (matchesOldNumber || (!oldNumber && matchesOldName)) {
            return {
              ...tx,
              customerName: cleanName || tx.customerName,
              customerNumber: cleanPhone || tx.customerNumber,
            };
          }
          return tx;
        })
      );

      const newId = cleanPhone || cleanName.toLowerCase() || selectedCustomer.id;
      setSelectedCustomerId(newId);
      setIsEditingContact(false);
      setEditSuccessMsg('Customer contact details updated successfully!');
      setTimeout(() => setEditSuccessMsg(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update contact info';
      setEditError(msg);
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <div className="customer-page-container">
      {/* Breadcrumbs */}
      <div className="header-breadcrumbs" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={() => navigate('/')}
          title="Back to Dashboard"
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Customer Directory</span>
      </div>

      {/* Page Title & Main Action on the Same Line */}
      <div className="page-header-row" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 className="page-heading">Customer Directory</h1>
          <p className="page-description">Client purchase history, lifetime value, and order logs</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/history', { state: { openAdd: true, defaultType: 'SELL_OUT' } })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.25rem' }}
          >
            <PlusCircle size={16} />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {errorMessage && <div className="alert-error-box">{errorMessage}</div>}

      {/* KPI Overview Metrics (CRM Stats Grid) */}
      <div className="crm-stats-grid">
        <div className="crm-stat-card">
          <span className="crm-stat-label">TOTAL ACTIVE CLIENTS</span>
          <span className="crm-stat-value">{metrics.totalClients}</span>
        </div>
        <div className="crm-stat-card">
          <span className="crm-stat-label">TOTAL CLIENT REVENUE</span>
          <span className="crm-stat-value text-gold">৳ {metrics.totalRevenue.toLocaleString('en-US')}</span>
        </div>
        <div className="crm-stat-card">
          <span className="crm-stat-label">TOP VIP CLIENT</span>
          <span className="crm-stat-value text-crimson">{metrics.topVip}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <CustomerFiltersBar
        nameFilter={searchName}
        onNameFilterChange={setSearchName}
        numberFilter={searchPhone}
        onNumberFilterChange={setSearchPhone}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Content Area */}
      {isLoading ? (
        <div className="loading-state-box">
          <span className="spinner"></span>
          <p>Loading customer profiles...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state-box">
          <Users size={48} className="empty-icon" />
          <h3>No Customer Records Found</h3>
          <p>
            Customer profiles are automatically compiled when sales are logged with client names or
            phone numbers.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/history', { state: { openAdd: true, defaultType: 'SELL_OUT' } })}
          >
            Log a Sale with Customer Details
          </button>
        </div>
      ) : (
        <div className="customer-grid">
          {customers.map((c) => (
            <div
              key={c.id}
              className="customer-card"
              onClick={() => setSelectedCustomerId(c.id)}
              role="button"
              tabIndex={0}
            >
              <div className="customer-card-header">
                <div className="profile-avatar">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="customer-header-details">
                  <h3 className="profile-name">{c.name}</h3>
                  <div className="profile-phone">
                    <Phone size={14} style={{ color: '#b45309' }} />
                    <span>{c.number}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="card-arrow" />
              </div>

              <div className="customer-card-stats">
                <div className="stat-col">
                  <span className="stat-sub">Total Spent</span>
                  <span className="stat-main text-gold">৳ {c.totalSpent.toLocaleString('en-US')}</span>
                </div>
                <div className="stat-col">
                  <span className="stat-sub">Orders</span>
                  <span className="stat-main">{c.purchaseCount} purchases</span>
                </div>
              </div>

              <div className="customer-card-footer">
                <Calendar size={14} />
                <span>Last Activity: {c.lastPurchaseDate}</span>
              </div>

              <div className="customer-card-action-link">
                <span>View Full Order History &amp; Edit Profile →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsEditingContact(false);
            setSelectedCustomerId(null);
          }}
        >
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="profile-avatar">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="modal-title-wrap">
                  <h2 className="modal-title">{selectedCustomer.name}</h2>
                  <span className="modal-subtitle">{selectedCustomer.number}</span>
                </div>
              </div>
              <div className="modal-header-actions">
                <button
                  type="button"
                  className="btn-edit-contact"
                  onClick={() => handleStartEditContact(selectedCustomer)}
                  title="Edit Contact Info"
                >
                  <Edit3 size={15} />
                  <span>Edit Contact Info</span>
                </button>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsEditingContact(false);
                    setSelectedCustomerId(null);
                  }}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="modal-body">
              {editSuccessMsg && (
                <div className="edit-success-banner">
                  <span>✓ {editSuccessMsg}</span>
                </div>
              )}

              <div className="customer-summary-pill-row">
                <div className="summary-pill">
                  <span className="pill-sub">Lifetime Spend</span>
                  <strong className="pill-val">৳ {selectedCustomer.totalSpent.toLocaleString('en-US')}</strong>
                </div>
                <div className="summary-pill">
                  <span className="pill-sub">Purchases</span>
                  <strong className="pill-val">{selectedCustomer.purchaseCount} orders</strong>
                </div>
                <div className="summary-pill">
                  <span className="pill-sub">Latest Order</span>
                  <strong className="pill-val">{selectedCustomer.lastPurchaseDate}</strong>
                </div>
              </div>

              <h4 className="orders-title">Purchase &amp; Invoice History</h4>
              <div className="orders-list">
                {selectedCustomer.transactions.map((tx) => (
                  <div key={tx.id} className="order-entry">
                    <div className="order-entry-left">
                      <span className="order-model">{tx.modelName}</span>
                      <span className="order-meta">
                        {tx.dateString} • {tx.quantity} pcs
                      </span>
                    </div>
                    <div className="order-entry-right">
                      <span className="order-amount">৳ {tx.totalAmount.toLocaleString('en-US')}</span>
                      <span className="order-type-badge">{tx.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsEditingContact(false);
                  setSelectedCustomerId(null);
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSelectedCustomerId(null);
                  navigate('/history', {
                    state: {
                      openAdd: true,
                      defaultType: 'SELL_OUT',
                      prefillCustomer: selectedCustomer.name,
                      prefillNumber: selectedCustomer.number,
                    },
                  });
                }}
              >
                + New Sale for this Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Profile Pop-up Dialog */}
      {isEditingContact && selectedCustomer && (
        <CustomerEditModal
          editName={editName}
          onEditNameChange={setEditName}
          editNumber={editPhone}
          onEditNumberChange={setEditPhone}
          isSaving={isSavingContact}
          errorMessage={editError}
          onClose={() => {
            setIsEditingContact(false);
            setEditError(null);
          }}
          onSave={handleSaveContact}
        />
      )}
    </div>
  );
};
