import React from 'react';

/**
 * Props contract for the InventoryFilterBar component.
 */
export interface InventoryFilterBarProps {
  /** The current search query string */
  searchQuery: string;
  /** Callback to update search query */
  onSearchChange: (query: string) => void;
  /** Total number of items matching the active search query */
  totalCount: number;
}

/**
 * Filter toolbar component for searching saree inventory by model name.
 * Provides instant reactive filtering and visual count badges.
 */
export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
}) => {
  return (
    <div className="search-filter-row">
      <div className="search-box">
        <label htmlFor="inventory-search" className="filter-label">
          Search by Model Name:
        </label>
        <input
          id="inventory-search"
          data-testid="inventory-search"
          type="text"
          className="form-input search-input"
          placeholder="e.g. Jamdani..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="table-meta">
        <span id="row-count" data-testid="row-count" className="count-pill">
          {totalCount} {totalCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
};
