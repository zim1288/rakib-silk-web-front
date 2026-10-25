import React from 'react';

export type CustomerSortOption = 'Newest' | 'Oldest' | 'A-Z' | 'Highest Spent';

export interface CustomerFiltersBarProps {
  nameFilter: string;
  onNameFilterChange: (val: string) => void;
  numberFilter: string;
  onNumberFilterChange: (val: string) => void;
  sortBy: CustomerSortOption;
  onSortByChange: (val: CustomerSortOption) => void;
}

export const CustomerFiltersBar: React.FC<CustomerFiltersBarProps> = ({
  nameFilter,
  onNameFilterChange,
  numberFilter,
  onNumberFilterChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="crm-filters-bar">
      <div className="filter-input-group">
        <input
          type="text"
          className="input-field"
          placeholder="Search by Client Name..."
          value={nameFilter}
          onChange={(e) => onNameFilterChange(e.target.value)}
        />
      </div>

      <div className="filter-input-group">
        <input
          type="text"
          className="input-field"
          placeholder="Search by Phone Number..."
          value={numberFilter}
          onChange={(e) => onNumberFilterChange(e.target.value)}
        />
      </div>

      <div className="filter-sort-group">
        <span className="sort-label">Sort by:</span>
        <select
          className="input-field select-sort"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as CustomerSortOption)}
        >
          <option value="Newest">Newest Active</option>
          <option value="Oldest">Oldest Active</option>
          <option value="Highest Spent">Highest Spent (VIP)</option>
          <option value="A-Z">Name A-Z</option>
        </select>
      </div>
    </div>
  );
};
