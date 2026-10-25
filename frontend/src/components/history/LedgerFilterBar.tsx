import React from 'react';

interface LedgerFilterBarProps {
  monthFilter: string;
  onMonthChange: (val: string) => void;
  yearFilter: string;
  onYearChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  resultCount: number;
}

/**
 * LedgerFilterBar Component
 *
 * Provides responsive filtering controls for the Financial Transaction Ledger:
 * - Month selection (January to December + All)
 * - Year selection (2024 to 2026 + All)
 * - Transaction type selector (All, Sales, Purchases, House Stock, Production)
 * - Free-text search input (matching model name, SKU, client name, or notes)
 * - Real-time filtered record counter pill
 */
export const LedgerFilterBar: React.FC<LedgerFilterBarProps> = ({
  monthFilter,
  onMonthChange,
  yearFilter,
  onYearChange,
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  resultCount,
}) => {
  return (
    <div className="ledger-filter-bar">
      {/* Month Filter */}
      <div className="ledger-filter-field">
        <label className="filter-label" style={{ fontSize: '0.8rem', color: '#57534e' }}>
          Month:
        </label>
        <select
          className="form-select filter-select"
          value={monthFilter}
          onChange={(e) => onMonthChange(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
        >
          <option value="ALL">All</option>
          <option value="0">January</option>
          <option value="1">February</option>
          <option value="2">March</option>
          <option value="3">April</option>
          <option value="4">May</option>
          <option value="5">June</option>
          <option value="6">July</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">October</option>
          <option value="10">November</option>
          <option value="11">December</option>
        </select>
      </div>

      {/* Year Filter */}
      <div className="ledger-filter-field">
        <label className="filter-label" style={{ fontSize: '0.8rem', color: '#57534e' }}>
          Year:
        </label>
        <select
          className="form-select filter-select"
          value={yearFilter}
          onChange={(e) => onYearChange(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
        >
          <option value="ALL">All</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      {/* Type Filter */}
      <div className="ledger-filter-field">
        <label className="filter-label" style={{ fontSize: '0.8rem', color: '#57534e' }}>
          Type:
        </label>
        <select
          id="transaction-type-filter"
          data-testid="transaction-type-filter"
          className="form-select filter-select"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
        >
          <option value="ALL">All Types</option>
          <option value="SELL_OUT">Sales (SELL_OUT)</option>
          <option value="PURCHASE_IN">Purchases (PURCHASE_IN)</option>
          <option value="HOUSE">House Stock</option>
          <option value="PRODUCTION">Production</option>
        </select>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <input
          id="transactions-search"
          data-testid="transactions-search"
          type="text"
          className="form-input"
          placeholder="Search model, customer, or SKU..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ padding: '0.5rem 0.85rem', width: '100%', fontSize: '0.88rem' }}
        />
      </div>

      {/* Active Record Counter */}
      <div className="table-meta">
        <span id="row-count" data-testid="row-count" className="count-pill">
          {resultCount} {resultCount === 1 ? 'record' : 'records'}
        </span>
      </div>
    </div>
  );
};
