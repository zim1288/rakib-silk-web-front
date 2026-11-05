import React from 'react';
import { Sparkles, Tag } from 'lucide-react';

/**
 * Props contract for the ProductionFilterBar component.
 */
export interface ProductionFilterBarProps {
  /** Saree model search string */
  searchQuery: string;
  onSearchChange: (query: string) => void;
  /** Currently selected lifecycle status filter ('ALL' | 'Pending' | 'In Progress' | 'Completed') */
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  /** Active department filter */
  brandFilter: 'ALL' | 'Rakib Silk' | 'Rakib Fashion';
  onBrandFilterChange: (brand: 'ALL' | 'Rakib Silk' | 'Rakib Fashion') => void;
  /** Live batch counts for each department */
  silkBatches: number;
  fashionBatches: number;
  allBatches: number;
  /** Total matching order count */
  totalCount: number;
}

/**
 * Filter toolbar for loom production orders.
 * Supports real-time text query, department line selection, and status lifecycle filtering.
 */
export const ProductionFilterBar: React.FC<ProductionFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  brandFilter,
  onBrandFilterChange,
  silkBatches,
  fashionBatches,
  allBatches,
  totalCount,
}) => {
  return (
    <div className="search-filter-row" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
      {/* Two-Part Department Tabs */}
      <div className="brand-tabs-filter" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'ALL'}
          className={`brand-tab-btn ${brandFilter === 'ALL' ? 'tab-active' : ''}`}
          onClick={() => onBrandFilterChange('ALL')}
          title="Show all weaving batches from both departments"
        >
          <span>All Batches ({allBatches})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'Rakib Silk'}
          className={`brand-tab-btn ${brandFilter === 'Rakib Silk' ? 'tab-active-silk' : ''}`}
          onClick={() => onBrandFilterChange('Rakib Silk')}
          title="Filter only Rakib Silk weaving orders"
        >
          <Sparkles size={14} />
          <span>✨ Rakib Silk ({silkBatches})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'Rakib Fashion'}
          className={`brand-tab-btn ${brandFilter === 'Rakib Fashion' ? 'tab-active-fashion' : ''}`}
          onClick={() => onBrandFilterChange('Rakib Fashion')}
          title="Filter only Rakib Fashion weaving orders"
        >
          <Tag size={14} />
          <span>🏷️ Rakib Fashion ({fashionBatches})</span>
        </button>
      </div>

      <div className="search-box" style={{ flex: '1 1 200px' }}>
        <label htmlFor="production-search" className="filter-label" style={{ display: 'none' }}>
          Search Model:
        </label>
        <input
          id="production-search"
          data-testid="production-search"
          type="text"
          className="form-input search-input"
          placeholder="Search weaving model..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-box">
        <label htmlFor="production-status-filter" className="filter-label">
          Status:
        </label>
        <select
          id="production-status-filter"
          data-testid="production-status-filter"
          className="form-select filter-select"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="table-meta">
        <span id="row-count" data-testid="row-count" className="count-pill">
          {totalCount} {totalCount === 1 ? 'batch' : 'batches'} shown
        </span>
      </div>
    </div>
  );
};
