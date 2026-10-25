import React from 'react';
import { InventoryItem } from '../../types';

export type InventorySortField = 'id' | 'modelName' | 'brandCategory' | 'unitPrice' | 'pieceCount';
export type InventorySortOrder = 'asc' | 'desc';

/**
 * Props contract for the InventoryTable component.
 */
export interface InventoryTableProps {
  /** Filtered and sorted inventory items to display */
  items: InventoryItem[];
  /** Currently active sort field */
  sortField: InventorySortField;
  /** Currently active sort direction */
  sortOrder: InventorySortOrder;
  /** Handler when user clicks a column header to sort */
  onSort: (field: InventorySortField) => void;
  /** Callback to trigger full resolution photo preview */
  onPreviewItem: (item: InventoryItem) => void;
  /** Callback to start inline editing */
  onEditItem: (item: InventoryItem) => void;
  /** ID of item currently pending delete confirmation */
  deleteConfirmId: number | null;
  /** Handler to initiate delete confirmation */
  onDeleteClick: (id: number) => void;
  /** Handler to execute verified deletion */
  onConfirmDelete: (id: number) => void;
  /** Handler to cancel delete confirmation */
  onCancelDelete: () => void;
  /** Global loading state */
  isLoading: boolean;
  /** Current search query for empty state messaging */
  searchQuery: string;
}

/**
 * High-performance inventory data table with column sorting,
 * clickable fabric thumbnails, inline delete safeguards, and empty state fallbacks.
 */
export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  sortField,
  sortOrder,
  onSort,
  onPreviewItem,
  onEditItem,
  deleteConfirmId,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
  isLoading,
  searchQuery,
}) => {
  if (items.length === 0) {
    return (
      <div id="empty-msg" data-testid="empty-msg" className="empty-state">
        <p className="empty-title">No inventory items found</p>
        <p className="empty-desc">
          {searchQuery
            ? `No sarees match "${searchQuery}". Clear search or add a new item.`
            : 'Your inventory is currently empty. Click "+ Add Saree Item" to create one.'}
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table id="inventory-table" data-testid="inventory-table" className="data-table">
        <thead>
          <tr>
            <th
              id="col-id"
              data-testid="col-id"
              onClick={() => onSort('id')}
              className="sortable-header"
            >
              ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-model"
              data-testid="col-model"
              onClick={() => onSort('modelName')}
              className="sortable-header"
            >
              Model Name {sortField === 'modelName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-category"
              data-testid="col-category"
              onClick={() => onSort('brandCategory')}
              className="sortable-header"
            >
              Category {sortField === 'brandCategory' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-price"
              data-testid="col-price"
              onClick={() => onSort('unitPrice')}
              className="sortable-header"
            >
              Unit Price (BDT) {sortField === 'unitPrice' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-count"
              data-testid="col-count"
              onClick={() => onSort('pieceCount')}
              className="sortable-header"
            >
              Piece Count {sortField === 'pieceCount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th className="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              id={`inventory-row-${item.id}`}
              data-testid={`inventory-row-${item.id}`}
            >
              <td className="cell-id">#{item.id}</td>
              <td className="cell-name">
                <div className="model-cell-content">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.modelName}
                      className="saree-thumbnail saree-thumbnail-clickable"
                      id={`item-thumbnail-${item.id}`}
                      data-testid={`item-thumbnail-${item.id}`}
                      title="Click to view bigger picture"
                      onClick={() => onPreviewItem(item)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        const fallback = document.getElementById(`fallback-thumb-${item.id}`);
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    id={`fallback-thumb-${item.id}`}
                    className="saree-thumbnail-placeholder"
                    style={{ display: item.imageUrl ? 'none' : 'flex' }}
                    title="No image"
                  >
                    🥻
                  </div>
                  <div className="model-details">
                    {item.imageUrl ? (
                      <button
                        type="button"
                        className="model-title-link"
                        id={`image-link-${item.id}`}
                        data-testid={`image-link-${item.id}`}
                        onClick={() => onPreviewItem(item)}
                        title="Click to view bigger picture"
                      >
                        {item.modelName}
                      </button>
                    ) : (
                      <strong className="model-title">{item.modelName}</strong>
                    )}
                  </div>
                </div>
              </td>
              <td className="cell-category">
                <span className="badge badge-light">{item.brandCategory || 'Silk'}</span>
              </td>
              <td className="cell-price">৳{item.unitPrice.toLocaleString()}</td>
              <td className="cell-count">
                <span className="badge badge-info">{item.pieceCount} pcs</span>
              </td>
              <td className="cell-actions">
                {deleteConfirmId === item.id ? (
                  <div className="inline-confirm-group">
                    <span className="confirm-prompt">Confirm?</span>
                    <button
                      id={`confirm-delete-btn-${item.id}`}
                      data-testid={`confirm-delete-btn-${item.id}`}
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => onConfirmDelete(item.id)}
                      disabled={isLoading}
                    >
                      Confirm
                    </button>
                    <button
                      id={`cancel-delete-btn-${item.id}`}
                      data-testid={`cancel-delete-btn-${item.id}`}
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={onCancelDelete}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="row-action-buttons">
                    <button
                      id={`edit-btn-${item.id}`}
                      data-testid={`edit-btn-${item.id}`}
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEditItem(item)}
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      id={`delete-btn-${item.id}`}
                      data-testid={`delete-btn-${item.id}`}
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDeleteClick(item.id)}
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
