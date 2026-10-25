import React from 'react';

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
  /** Total matching order count */
  totalCount: number;
}

/**
 * Filter toolbar for loom production orders.
 * Supports real-time text query and status lifecycle filtering.
 */
export const ProductionFilterBar: React.FC<ProductionFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
}) => {
  return (
    <div className="search-filter-row">
      <div className="search-box">
        <label htmlFor="production-search" className="filter-label">
          Search Model:
        </label>
        <input
          id="production-search"
          data-testid="production-search"
          type="text"
          className="form-input search-input"
          placeholder="e.g. Benarasi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-box">
        <label htmlFor="production-status-filter" className="filter-label">
          Filter Status:
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
          {totalCount} {totalCount === 1 ? 'batch' : 'batches'}
        </span>
      </div>
    </div>
  );
};
