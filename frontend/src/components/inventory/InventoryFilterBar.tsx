import React from 'react';
import { Sparkles, Tag } from 'lucide-react';

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
  /** Active department filter */
  brandFilter: 'ALL' | 'Rakib Silk' | 'Rakib Fashion';
  /** Callback to switch department filter */
  onBrandFilterChange: (brand: 'ALL' | 'Rakib Silk' | 'Rakib Fashion') => void;
  /** Live piece counts for each department */
  silkPieces: number;
  fashionPieces: number;
  allPieces: number;
}

/**
 * Filter toolbar component for searching saree inventory by model name and department line.
 * Provides instant reactive filtering and visual count badges.
 */
export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
  brandFilter,
  onBrandFilterChange,
  silkPieces,
  fashionPieces,
  allPieces,
}) => {
  return (
    <div className="search-filter-row" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
      {/* Two-Part Category Tabs */}
      <div className="brand-tabs-filter" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'ALL'}
          className={`brand-tab-btn ${brandFilter === 'ALL' ? 'tab-active' : ''}`}
          onClick={() => onBrandFilterChange('ALL')}
          title="Show all sarees from both departments"
        >
          <span>All Sarees ({allPieces} pcs)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'Rakib Silk'}
          className={`brand-tab-btn ${brandFilter === 'Rakib Silk' ? 'tab-active-silk' : ''}`}
          onClick={() => onBrandFilterChange('Rakib Silk')}
          title="Filter only luxury Rakib Silk collection"
        >
          <Sparkles size={14} />
          <span>✨ Rakib Silk ({silkPieces} pcs)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={brandFilter === 'Rakib Fashion'}
          className={`brand-tab-btn ${brandFilter === 'Rakib Fashion' ? 'tab-active-fashion' : ''}`}
          onClick={() => onBrandFilterChange('Rakib Fashion')}
          title="Filter only Rakib Fashion collection"
        >
          <Tag size={14} />
          <span>🏷️ Rakib Fashion ({fashionPieces} pcs)</span>
        </button>
      </div>

      <div className="search-box" style={{ flex: '1 1 240px' }}>
        <label htmlFor="inventory-search" className="filter-label" style={{ display: 'none' }}>
          Search by Model Name:
        </label>
        <input
          id="inventory-search"
          data-testid="inventory-search"
          type="text"
          className="form-input search-input"
          placeholder="Search by model name or fabric..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="table-meta">
        <span id="row-count" data-testid="row-count" className="count-pill">
          {totalCount} {totalCount === 1 ? 'model' : 'models'} shown
        </span>
      </div>
    </div>
  );
};
