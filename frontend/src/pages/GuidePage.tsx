import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  ShoppingBag,
  TrendingUp,
  Users,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Database,
  Package,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GuidePage: React.FC = () => {
  const { userEmail } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('ALL');

  useEffect(() => {
    document.title = 'Operations & User Guide - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
    }
  }, [userEmail, navigate]);

  const pillars = [
    {
      id: 'inventory',
      title: '1. Inventory & House Stock Management',
      icon: <Package size={22} className="text-burgundy" />,
      colorClass: 'icon-burgundy',
      targetRoute: '/inventory',
      routeText: 'Open Inventory',
      summary: 'Catalog saree models, track pieces in hand, set unit prices, and monitor low stock.',
      steps: [
        'Navigate to Inventory from the top navbar to view all current sarees in shop stock.',
        'Click "+ Add Saree Item" to catalog a new model with SKU, color, fabric, price, and initial quantity.',
        'Optionally attach a saree photo via local device file upload or camera.',
        'Use the "Edit" action on any row to adjust piece counts, update pricing, or alter color codes immediately.',
        'Critical Stock Depletion alerts appear at the top whenever physical pieces drop below your safety threshold.',
      ],
    },
    {
      id: 'purchase',
      title: '2. Staging Cargo Purchases & Supplier Inflow',
      icon: <ShoppingBag size={22} className="text-gold" />,
      colorClass: 'icon-gold',
      targetRoute: '/purchase',
      routeText: 'Open Purchase',
      summary: 'Stage incoming supplier shipments, calculate cargo costs, and commit bulk stock.',
      steps: [
        'Open Purchase to manage vendor invoices and incoming cargo from wholesale looms.',
        'Add incoming saree models and quantity into your temporary "Cargo Staging Cart".',
        'Review total shipment investment and individual cost breakdowns.',
        'When the physical shipment arrives, click "COMMIT TO HOUSE STOCK".',
        'The system automatically increases house inventory piece counts and creates an official commercial expense record in your financial ledger.',
      ],
    },
    {
      id: 'sales',
      title: '3. Point of Sale (POS) & Retail Invoicing',
      icon: <TrendingUp size={22} className="text-forest" />,
      colorClass: 'icon-sage',
      targetRoute: '/sales',
      routeText: 'Open Sales POS',
      summary: 'Record retail counter sales, verify stock availability, and print instant sales invoices.',
      steps: [
        'Open Sales when a customer is purchasing sarees at the showroom counter.',
        'Select the saree model from the dropdown; the system verifies sufficient stock is physically available in hand.',
        'Enter sold quantity, customer full name, and mobile number.',
        'Click "Record Sale & Issue Invoice" to immediately decrement inventory counts.',
        'The system generates a luxury printable invoice with serial number, date (DD/MM/YYYY), and store stamp for the customer.',
      ],
    },
    {
      id: 'production',
      title: '4. Loom Production Scheduling & Weaving',
      icon: <Sparkles size={22} className="text-bronze" />,
      colorClass: 'icon-bronze',
      targetRoute: '/production',
      routeText: 'Open Production',
      summary: 'Track artisan looms, monitor active weaving batches, and transition stages.',
      steps: [
        'Open Production to oversee artisan weavers and active loom orders.',
        'Click "+ Schedule Batch" with target model, quantity, and estimated completion date.',
        'Track batch lifecycle through three distinct statuses: "Pending", "In Progress", and "Completed".',
        'When finished, mark as Completed to stage finished sarees for inventory addition.',
        'Active weaving quantities are tracked live on the executive dashboard.',
      ],
    },
    {
      id: 'customers',
      title: '5. Customer Lifetime Directory & Analytics',
      icon: <Users size={22} className="text-saddle" />,
      colorClass: 'icon-saddle',
      targetRoute: '/customers',
      routeText: 'Open Customers',
      summary: 'Maintain customer contact profiles, track total spending, and reward VIP clients.',
      steps: [
        'Customer profiles are automatically compiled and updated from retail sales invoices.',
        'Search clients instantly by phone number or name.',
        'View total lifetime spend in BDT, visit count, and last purchase date.',
        'Use customer spending rankings to offer special seasonal loyalty discounts.',
      ],
    },
    {
      id: 'ledger',
      title: '6. Tally Khata Ledger & Financial Auditing',
      icon: <History size={22} className="text-teal" />,
      colorClass: 'icon-teal',
      targetRoute: '/history',
      routeText: 'Open History',
      summary: 'Audit sales revenue, purchase expenses, net profit/loss, and date/month/year timelines.',
      steps: [
        'Open Transactions / Ledger to audit all commercial money movements.',
        'Monitor four key financial metrics: Sales Revenue (Inflow), Cargo Intake (Outflow), Net Profit/Loss, and Total Records.',
        'Filter records by Month, Year, and Transaction Type (Sales, Purchases, Production).',
        'All dates are standardized in DD/MM/YYYY (date/month/year) format.',
        'Switch to "Operations & System Audit Trail" to inspect who created, modified, or deleted shop records.',
      ],
    },
    {
      id: 'exports',
      title: '7. Data Export Center (CSV, Excel & PDF)',
      icon: <FileSpreadsheet size={22} className="text-gold" />,
      colorClass: 'icon-gold',
      targetRoute: '/settings',
      routeText: 'Open Data Export Center',
      summary: 'Export inventory spreadsheets, download filtered ledger records, and print official PDF audits.',
      steps: [
        'Open Settings and select the "Data Export Center" tab.',
        'Export Inventory to CSV with UTF-8 BOM encoding so Bengali and English characters open seamlessly in Excel.',
        'Filter the Transaction Ledger by Type and Date Range, then click "Export Filtered Ledger to CSV".',
        'Click "🖨️ Print / Save as PDF" to generate a formatted printable ledger audit report with store headers and total turnover.',
        'Download complete JSON database snapshots for secure offline backup archives.',
      ],
    },
  ];

  const filteredPillars = pillars.filter((p) => {
    if (selectedPillar !== 'ALL' && p.id !== selectedPillar) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.steps.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-wrapper">
      {/* Header Banner */}
      <div className="page-header-row" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
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
            <span className="breadcrumb-current">Operations &amp; User Guide</span>
          </div>
          <h1 className="page-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BookOpen size={28} className="text-burgundy" />
            <span>Operations &amp; User Guide</span>
          </h1>
          <p className="page-description">
            Complete operational handbook, workflow guide, and best practices for managing Rakib Silk &amp; Fashion
          </p>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div
        className="table-controls-card"
        style={{
          background: '#ffffff',
          border: '1px solid #f1ece8',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#a8a29e',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search workflows, guides, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${selectedPillar === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPillar('ALL')}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            All Pillars
          </button>
          <button
            type="button"
            className={`btn ${selectedPillar === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPillar('inventory')}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            Inventory
          </button>
          <button
            type="button"
            className={`btn ${selectedPillar === 'purchase' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPillar('purchase')}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            Purchase
          </button>
          <button
            type="button"
            className={`btn ${selectedPillar === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPillar('sales')}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            Sales POS
          </button>
          <button
            type="button"
            className={`btn ${selectedPillar === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPillar('ledger')}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            Ledger
          </button>
        </div>
      </div>

      {/* Guide Pillars List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {filteredPillars.map((p) => (
          <div
            key={p.id}
            className="settings-action-card"
            style={{
              background: '#ffffff',
              border: '1px solid #f1ece8',
              borderLeft: '5px solid #701a2d',
              borderRadius: '12px',
              padding: '1.75rem 2rem',
              boxShadow: '0 4px 16px rgba(76, 5, 25, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.85rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={`header-icon-circle ${p.colorClass}`} style={{ width: '42px', height: '42px' }}>
                  {p.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#701a2d' }}>
                    {p.title}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#78716c' }}>{p.summary}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(p.targetRoute)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.85rem',
                  padding: '0.5rem 1rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(112, 26, 45, 0.25)',
                }}
              >
                <span>{p.routeText}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div
              style={{
                marginTop: '1rem',
                background: '#fafaf9',
                border: '1px solid #f5f5f4',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
              }}
            >
              <h4
                style={{
                  margin: '0 0 0.65rem 0',
                  fontSize: '0.82rem',
                  color: '#701a2d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 700,
                }}
              >
                Standard Operating Procedure:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {p.steps.map((step, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem', color: '#44403c', lineHeight: 1.55 }}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
