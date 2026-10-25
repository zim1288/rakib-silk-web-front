import React from 'react';

/**
 * Metric summary figures for commercial transactions
 */
export interface LedgerMetricsSummary {
  inflow: number;
  inflowOrders: number;
  outflow: number;
  outflowOrders: number;
  netProfit: number;
  margin: string;
  totalCount: number;
}

interface LedgerMetricCardsProps {
  metrics: LedgerMetricsSummary;
  monthFilter: string;
  yearFilter: string;
}

/**
 * LedgerMetricCards Component
 *
 * Displays the four executive-level financial metric cards:
 * 1. Sales Revenue (Inflow)
 * 2. Cargo Intake (Outflow)
 * 3. Net Profit / Loss with margin percentage
 * 4. Filtered Transactions count
 */
export const LedgerMetricCards: React.FC<LedgerMetricCardsProps> = ({
  metrics,
  monthFilter,
  yearFilter,
}) => {
  return (
    <div className="ledger-metrics-grid">
      {/* 1. SALES REVENUE (INFLOW) */}
      <div className="ledger-metric-card ledger-card-inflow">
        <span className="ledger-metric-title">SALES REVENUE (INFLOW)</span>
        <div className="ledger-metric-amount">
          <span style={{ fontFamily: 'sans-serif', marginRight: '0.2rem' }}>৳</span>
          {metrics.inflow.toLocaleString()}
        </div>
        <span className="ledger-metric-sub">{metrics.inflowOrders} client sales</span>
      </div>

      {/* 2. CARGO INTAKE (OUTFLOW) */}
      <div className="ledger-metric-card ledger-card-outflow">
        <span className="ledger-metric-title">CARGO INTAKE (OUTFLOW)</span>
        <div className="ledger-metric-amount">
          <span style={{ fontFamily: 'sans-serif', marginRight: '0.2rem' }}>৳</span>
          {metrics.outflow.toLocaleString()}
        </div>
        <span className="ledger-metric-sub">{metrics.outflowOrders} purchase orders</span>
      </div>

      {/* 3. NET PROFIT / LOSS */}
      <div className={`ledger-metric-card ${metrics.netProfit >= 0 ? 'ledger-card-inflow' : 'ledger-card-net'}`}>
        <span className="ledger-metric-title">NET PROFIT / LOSS</span>
        <div className="ledger-metric-amount">
          <span style={{ fontFamily: 'sans-serif', marginRight: '0.2rem' }}>৳</span>
          {metrics.netProfit < 0
            ? `-${Math.abs(metrics.netProfit).toLocaleString()}`
            : metrics.netProfit.toLocaleString()}
        </div>
        <span className="ledger-metric-sub">Margin: {metrics.margin}% of sales</span>
      </div>

      {/* 4. FILTERED TRANSACTIONS */}
      <div className="ledger-metric-card ledger-card-filtered">
        <span className="ledger-metric-title">FILTERED TRANSACTIONS</span>
        <div className="ledger-metric-amount">{metrics.totalCount}</div>
        <span className="ledger-metric-sub">
          Timeframe: {monthFilter === 'ALL' && yearFilter === 'ALL' ? 'All' : 'Filtered'}
        </span>
      </div>
    </div>
  );
};
