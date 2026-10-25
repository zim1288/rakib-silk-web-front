import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Wrench, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInventory, getProduction, getTransactions } from '../services/api';
import { getActionHistory } from '../services/history';
import { InventoryItem, ProductionItem, TransactionItem } from '../types';

export const DashboardPage: React.FC = () => {
  const { userEmail, apiLatency } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [production, setProduction] = useState<ProductionItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Critical Stock Monitor State
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('stock_safety_threshold');
    return saved ? Number(saved) : 5;
  });
  const [stockFilter, setStockFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'URGENT'>('ALL');

  useEffect(() => {
    document.title = 'Home - Silk & Fashion';
    if (!userEmail) {
      navigate('/login', { replace: true });
      return;
    }
    loadData(false);

    // Multi-Device Real-Time Auto-Sync:
    const handleFocus = () => {
      loadData(true);
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      loadData(true);
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [userEmail, navigate]);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const [invData, prodData, txData] = await Promise.all([
        getInventory().catch(() => [] as InventoryItem[]),
        getProduction().catch(() => [] as ProductionItem[]),
        getTransactions().catch(() => [] as TransactionItem[]),
      ]);
      setInventory(invData);
      setProduction(prodData);
      setTransactions(txData);

      const auditList = getActionHistory();
      setHistoryCount(auditList.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleThresholdChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(50, newVal));
    setThreshold(clamped);
    localStorage.setItem('stock_safety_threshold', clamped.toString());
  };

  const scrollToStockMonitor = () => {
    const el = document.getElementById('critical-stock-monitor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Total valuation = sum of (unitPrice * pieceCount)
  const totalValuation = inventory.reduce((acc, item) => {
    const price = Number(item.unitPrice) || 0;
    const pieces = Number(item.pieceCount) || 0;
    return acc + price * pieces;
  }, 0);

  const activeModelsCount = inventory.length;

  const activeWeavingCount = production
    .filter((item) => item.status === 'In Progress')
    .reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  const totalInHandPieces = inventory.reduce(
    (acc, item) => acc + (Number(item.pieceCount) || 0),
    0
  );

  // Total sales revenue recorded in transactions ledger
  const totalSalesRecorded = transactions
    .filter((t) => t.type === 'SELL_OUT')
    .reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);

  // Unique customers count from transactions
  const uniqueCustomers = new Set(
    transactions
      .filter((t) => (t.customerName && t.customerName.trim()) || (t.customerNumber && t.customerNumber.trim()))
      .map((t) => (t.customerNumber && t.customerNumber.trim()) || t.customerName!.trim().toLowerCase())
  );

  // Stock Depletion Calculations
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => (Number(item.pieceCount) || 0) <= threshold);
  }, [inventory, threshold]);

  const outOfStockItems = useMemo(() => {
    return inventory.filter((item) => (Number(item.pieceCount) || 0) === 0);
  }, [inventory]);

  const urgentItems = useMemo(() => {
    return inventory.filter((item) => {
      const count = Number(item.pieceCount) || 0;
      return count > 0 && count <= Math.min(2, threshold);
    });
  }, [inventory, threshold]);

  const outOfStockCount = outOfStockItems.length;
  const approachingCount = Math.max(0, lowStockItems.length - outOfStockCount);
  const urgentCount = urgentItems.length;

  const displayLowItems = useMemo(() => {
    if (stockFilter === 'OUT_OF_STOCK') return outOfStockItems;
    if (stockFilter === 'URGENT') return urgentItems;
    return lowStockItems;
  }, [stockFilter, lowStockItems, outOfStockItems, urgentItems]);

  // Top Saree Models (sorted by piece count descending or valuation)
  const topModels = useMemo(() => {
    return inventory
      .slice()
      .sort((a, b) => (Number(b.pieceCount) || 0) - (Number(a.pieceCount) || 0))
      .slice(0, 4);
  }, [inventory]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US');
  };

  return (
    <div className="dashboard-container">
      {/* Executive Header Row matching the reference design */}
      <div className="executive-dashboard-header">
        <div className="header-titles-group">
          <span className="executive-overline">EXECUTIVE DASHBOARD</span>
          <h1 className="overview-heading">Overview &amp; Core Pillars</h1>
        </div>

        <div className="header-right-group">
          {lowStockItems.length > 0 && (
            <button
              type="button"
              className="header-low-stock-pill"
              onClick={scrollToStockMonitor}
              title="Jump to Critical Stock Monitor"
            >
              <span className="low-stock-dot"></span>
              <span>{lowStockItems.length} Low Stock Attention ↓</span>
            </button>
          )}

          <div className="manager-status-pill">
            <span className="manager-dot-pulse"></span>
            <span className="manager-label">Manager Logged:</span>
            <span className="manager-email">{userEmail}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadData(true)}
            title="Refresh Live Data"
            disabled={isRefreshing || isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw className={isRefreshing ? 'spinning' : ''} size={14} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-error-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span>{errorMessage}</span>
          <button type="button" className="btn btn-secondary" onClick={() => loadData(true)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* TOTAL STOCK VALUATION HERO CARD (Luxury Deep Burgundy & Gold Banner with 5 Metrics) */}
      <section className="executive-valuation-hero" data-testid="valuation_hero_card">
        <div className="hero-top-centered">
          <span className="hero-valuation-label">TOTAL STOCK VALUATION</span>
          <div className="hero-currency-amount">
            <span className="taka-symbol">৳</span> {isLoading ? '...' : formatCurrency(totalValuation)} <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>BDT</span>
          </div>
          <p className="hero-valuation-sub">
            Calculated dynamically from active in-house saree catalog piece counts and unit prices.
          </p>
        </div>

        <div className="hero-five-metrics-row">
          <div className="metric-card-box">
            <span className="metric-number-big">{isLoading ? '-' : activeModelsCount}</span>
            <span className="metric-title-small">ACTIVE MODELS</span>
          </div>

          <div className="metric-card-box">
            <span className="metric-number-big">{isLoading ? '-' : activeWeavingCount}</span>
            <span className="metric-title-small">TOTAL WEAVING (PCS)</span>
          </div>

          <div className="metric-card-box">
            <span className="metric-number-big">{isLoading ? '-' : totalInHandPieces}</span>
            <span className="metric-title-small">IN-HAND STOCK (PCS)</span>
          </div>

          <div className="metric-card-box">
            <span className="metric-number-big gold-glow">
              ৳ {isLoading ? '0' : formatCurrency(totalSalesRecorded)}
            </span>
            <span className="metric-title-small">TOTAL SALES (BDT)</span>
          </div>

          <div
            className="metric-card-box metric-card-alert"
            onClick={scrollToStockMonitor}
            role="button"
            tabIndex={0}
            title="Click to inspect depleted saree stock"
          >
            <span className="metric-number-big">
              {lowStockItems.length}
            </span>
            <span className="metric-title-small">
              ⚠️ LOW STOCK MODELS
            </span>
          </div>
        </div>
      </section>

      {/* CORE PILLARS SECTION */}
      <section className="pillars-showcase-section">
        <div className="pillars-section-headline">
          <div className="pillars-title-group">
            <h2 className="pillars-section-title">CORE PILLARS</h2>
            <div className="pillars-title-gold-bar"></div>
          </div>
          <span className="pillars-section-subtitle">Direct business modules &amp; execution hubs</span>
        </div>

        <div className="core-pillars-grid-3x2">
          {/* 1. Stock in House */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/inventory')}
            role="button"
            tabIndex={0}
            data-testid="pillar_stock_inventory"
          >
            <div className="card-top-identity">
              <div className="module-icon-container icon-house">
                <span className="pillar-icon">🏠</span>
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Stock in House</h3>
                <p className="module-sub-desc">In-hand saree catalog, pricing &amp; pieces</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">{activeModelsCount} Models • {totalInHandPieces} pcs</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>

          {/* 2. Stock in Production */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/production')}
            role="button"
            tabIndex={0}
            data-testid="pillar_stock_production"
          >
            <div className="card-top-identity">
              <div className="module-icon-container bg-icon-burgundy">
                <Wrench size={22} />
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Stock in Production</h3>
                <p className="module-sub-desc">Track manufacturing, loom stages &amp; batches</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">{production.length} Batches • {activeWeavingCount} pcs weaving</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>

          {/* 3. Purchase Product */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/purchase')}
            role="button"
            tabIndex={0}
            data-testid="pillar_purchase_product"
          >
            <div className="card-top-identity">
              <div className="module-icon-container icon-cart">
                <span className="pillar-icon">🛒</span>
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Purchase Product</h3>
                <p className="module-sub-desc">Stage bulk incoming cargo shipments &amp; intake</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">Stage Cargo Staging Cart</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>

          {/* 4. Sell Product */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/sales')}
            role="button"
            tabIndex={0}
            data-testid="pillar_sell_product"
          >
            <div className="card-top-identity">
              <div className="module-icon-container icon-tag">
                <span className="pillar-icon">🏷️</span>
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Sell Product</h3>
                <p className="module-sub-desc">Record retail client sales &amp; instant stock deduct</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">৳ {formatCurrency(totalSalesRecorded)} billed</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>

          {/* 5. Customer Directory */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/customers')}
            role="button"
            tabIndex={0}
            data-testid="pillar_customer_directory"
          >
            <div className="card-top-identity">
              <div className="module-icon-container icon-user">
                <span className="pillar-icon">👤</span>
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Customer Directory</h3>
                <p className="module-sub-desc">Client VIP profiles, order history &amp; contact logs</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">{uniqueCustomers.size} Active Buyers</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>

          {/* 6. Ledger & Profit/Loss */}
          <div
            className="pillar-module-card"
            onClick={() => navigate('/history')}
            role="button"
            tabIndex={0}
            data-testid="pillar_audit_history"
          >
            <div className="card-top-identity">
              <div className="module-icon-container icon-list">
                <span className="pillar-icon">📋</span>
              </div>
              <div className="module-title-wrap">
                <h3 className="module-main-name">Ledger &amp; Profit/Loss</h3>
                <p className="module-sub-desc">Central financial ledger &amp; audit oversight</p>
              </div>
            </div>
            <div className="card-bottom-metric">
              <span className="metric-tagline">{historyCount} Total Records</span>
              <ArrowRight size={16} className="metric-arrow" />
            </div>
          </div>
        </div>
      </section>

      {/* CRITICAL STOCK MONITOR SECTION */}
      <section id="critical-stock-monitor" className="critical-stock-section">
        <div className="critical-stock-header-row">
          <div>
            <div className="critical-stock-badges-row">
              <span className="badge-critical-stock">⚠️ CRITICAL STOCK MONITOR</span>
              <span className="badge-safety-threshold">Safety Threshold: ≤ {threshold} pcs</span>
            </div>
            <h2 className="critical-stock-title">Attention Required: Stock Depletion Alerts</h2>
            <p className="critical-stock-subtitle">
              Calculates real-time inventory levels against your safety threshold to prevent stockouts and safeguard retail checkout.
            </p>
          </div>

          {/* Alert Threshold Adjuster */}
          <div className="threshold-adjuster-card">
            <span className="threshold-card-title">Alert Threshold</span>
            <span className="threshold-card-sub">Flag items when stock is ≤:</span>
            <div className="threshold-stepper-row">
              <button
                type="button"
                className="btn-stepper"
                onClick={() => handleThresholdChange(threshold - 1)}
                title="Decrease Threshold"
              >
                −
              </button>
              <div className="threshold-value-display">{threshold} pcs</div>
              <button
                type="button"
                className="btn-stepper"
                onClick={() => handleThresholdChange(threshold + 1)}
                title="Increase Threshold"
              >
                +
              </button>
            </div>
            <div className="threshold-presets-row">
              <span className="presets-label">Presets:</span>
              {[2, 3, 5, 8, 10, 15].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`btn-preset-pill ${threshold === val ? 'preset-active' : ''}`}
                  onClick={() => handleThresholdChange(val)}
                >
                  {val} pcs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Pills and Summary Row */}
        <div className="stock-filter-summary-row">
          <div className="stock-filter-pills">
            <button
              type="button"
              className={`stock-filter-btn ${stockFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStockFilter('ALL')}
            >
              All Low ({lowStockItems.length})
            </button>
            <button
              type="button"
              className={`stock-filter-btn ${stockFilter === 'OUT_OF_STOCK' ? 'active' : ''}`}
              onClick={() => setStockFilter('OUT_OF_STOCK')}
            >
              Out of Stock (0 pcs) ({outOfStockCount})
            </button>
            <button
              type="button"
              className={`stock-filter-btn ${stockFilter === 'URGENT' ? 'active' : ''}`}
              onClick={() => setStockFilter('URGENT')}
            >
              Urgent Depletion ({urgentCount})
            </button>
          </div>

          <div className="stock-summary-indicators">
            <span className="indicator-pill indicator-danger">{outOfStockCount} Out of Stock</span>
            <span className="indicator-pill indicator-warning">{approachingCount} Approaching Depletion</span>
            <button type="button" className="btn-link-settings" onClick={() => navigate('/settings')}>
              Configure in Settings →
            </button>
          </div>
        </div>

        {/* Depleted & Low Stock Item Cards Grid */}
        {displayLowItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#fafaf9', borderRadius: '10px', border: '1px dashed #d6d3d1' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#15803d', fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
              All Stocks Healthy
            </h4>
            <p style={{ margin: 0, color: '#78716c', fontSize: '0.875rem' }}>
              No saree models currently fall under your safety threshold of {threshold} pcs.
            </p>
          </div>
        ) : (
          <div className="low-stock-cards-grid">
            {displayLowItems.map((item) => {
              const count = Number(item.pieceCount) || 0;
              const isDepleted = count === 0;
              const pct = Math.min(100, Math.round((count / threshold) * 100));

              return (
                <div key={item.id} className="depleted-saree-card">
                  <div>
                    <div className="card-media-and-badges">
                      <div className="depleted-thumbnail-wrap">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.modelName}
                            className="depleted-thumb-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥻</text></svg>';
                            }}
                          />
                        ) : (
                          <div className="depleted-thumb-placeholder">🥻</div>
                        )}
                        {isDepleted && <span className="overlay-badge-0pcs">0 PCS</span>}
                      </div>
                      <div className="depleted-badges-col">
                        <span className={`status-pill ${isDepleted ? 'pill-depleted' : 'pill-approaching'}`}>
                          • {isDepleted ? 'DEPLETED (0 pcs)' : `${count} pcs Left`}
                        </span>
                        <span className="brand-pill">{item.brandCategory || 'Rakib Silk'}</span>
                      </div>
                    </div>

                    <div className="depleted-info-block">
                      <h4 className="depleted-model-name">{item.modelName}</h4>
                      <div className="depleted-sku-line">
                        <span>SKU: {item.sku || 'N/A'}</span>
                        {item.fabricType && <span>Fabric: {item.fabricType}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>

                    <div className="depleted-progress-block">
                      <div className="progress-labels">
                        <span>Stock vs Safety Level ({threshold} pcs):</span>
                        <span className="progress-fraction">{count} / {threshold} pcs ({pct}%)</span>
                      </div>
                      <div className="depleted-progress-track">
                        <div
                          className={`depleted-progress-fill ${isDepleted ? 'fill-danger' : 'fill-warning'}`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        ></div>
                      </div>
                      <span className="progress-caption">
                        {isDepleted ? 'Model completely out of stock in-house' : 'Approaching low threshold'}
                      </span>
                    </div>
                  </div>

                  <div className="depleted-card-footer">
                    <div className="retail-price-display">
                      <span className="price-label">RETAIL PRICE</span>
                      <span className="price-val">৳{formatCurrency(Number(item.unitPrice) || 0)}</span>
                    </div>
                    <div className="depleted-footer-actions">
                      <button
                        type="button"
                        className="btn-reorder-cargo"
                        onClick={() => navigate('/purchase', { state: { prefillModel: item.modelName } })}
                        title="Reorder this depleted model in Cargo Purchase"
                      >
                        <ShoppingCart size={13} style={{ marginRight: '0.2rem' }} />
                        <span>Reorder Cargo</span>
                      </button>
                      <button
                        type="button"
                        className="btn-open-catalog"
                        onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.modelName)}`)}
                        title="Inspect in House Inventory"
                      >
                        Catalog →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TOP SAREE MODELS IN STOCK SECTION */}
      {topModels.length > 0 && (
        <section className="top-models-showcase-section">
          <div className="top-models-header-row">
            <div>
              <h3 className="top-models-heading">Top Saree Models in Stock</h3>
              <p className="top-models-subtitle">Real-time valuation breakdown</p>
            </div>
            <button
              type="button"
              className="btn-view-inventory"
              onClick={() => navigate('/inventory')}
            >
              View Full Inventory Table →
            </button>
          </div>

          <div className="top-models-cards-row">
            {topModels.map((item) => (
              <div
                key={item.id}
                className="top-model-mini-card"
                onClick={() => navigate('/inventory')}
                role="button"
                tabIndex={0}
              >
                <div className="mini-card-thumb">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.modelName}
                      className="mini-thumb-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥻</text></svg>';
                      }}
                    />
                  ) : (
                    <span className="mini-placeholder-icon">🥻</span>
                  )}
                </div>
                <div className="mini-card-details">
                  <h5 className="mini-model-name">{item.modelName}</h5>
                  <span className="mini-model-brand">{item.brandCategory || 'Rakib Silk'}</span>
                  <span className="mini-model-price">৳{formatCurrency(Number(item.unitPrice) || 0)}</span>
                </div>
                <div className="mini-card-badge">
                  <span className="mini-piece-badge">{item.pieceCount || 0} pcs</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* QUICK-NAV KNOWLEDGE & EXPORT CARDS */}
      <div className="knowledge-exports-grid">
        <div
          className="knowledge-card"
          onClick={() => navigate('/guide')}
          role="button"
          tabIndex={0}
        >
          <div className="knowledge-icon-wrap icon-book">📖</div>
          <div className="knowledge-info">
            <h4 className="knowledge-title">Operations &amp; User Guide</h4>
            <p className="knowledge-desc">Step-by-step documentation for all shop pillars and workflows</p>
          </div>
          <span className="knowledge-link">Open Guide →</span>
        </div>

        <div
          className="knowledge-card"
          onClick={() => navigate('/settings')}
          role="button"
          tabIndex={0}
        >
          <div className="knowledge-icon-wrap icon-download">📥</div>
          <div className="knowledge-info">
            <h4 className="knowledge-title">Data Export Center</h4>
            <p className="knowledge-desc">Download Excel-compatible CSVs, print PDF reports, and database snapshots</p>
          </div>
          <span className="knowledge-link">Open Export Hub →</span>
        </div>
      </div>
    </div>
  );
};
