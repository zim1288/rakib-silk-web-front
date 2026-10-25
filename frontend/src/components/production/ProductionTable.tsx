import React from 'react';
import { ProductionItem } from '../../types';

export type ProductionSortField =
  | 'id'
  | 'modelName'
  | 'quantity'
  | 'estimatedCompletionDate'
  | 'status';
export type ProductionSortOrder = 'asc' | 'desc';

/**
 * Props contract for the ProductionTable component.
 */
export interface ProductionTableProps {
  /** Filtered and sorted production orders */
  items: ProductionItem[];
  /** Current column sort field */
  sortField: ProductionSortField;
  /** Current sort direction */
  sortOrder: ProductionSortOrder;
  /** Handler to sort by column */
  onSort: (field: ProductionSortField) => void;
  /** Handler to initiate editing */
  onEditItem: (item: ProductionItem) => void;
  /** ID of order awaiting delete confirmation */
  deleteConfirmId: number | null;
  /** Handler to request deletion */
  onDeleteClick: (id: number) => void;
  /** Handler to execute confirmed deletion */
  onConfirmDelete: (id: number) => void;
  /** Handler to cancel deletion */
  onCancelDelete: () => void;
  /** Global loading indicator */
  isLoading: boolean;
  /** Current search query for empty state copy */
  searchQuery: string;
  /** Current status filter for empty state copy */
  statusFilter: string;
}

/**
 * Production orders ledger table.
 * Features sortable columns, dynamic status pill color badges,
 * inline deletion safety guards, and empty state prompts.
 */
export const ProductionTable: React.FC<ProductionTableProps> = ({
  items,
  sortField,
  sortOrder,
  onSort,
  onEditItem,
  deleteConfirmId,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
  isLoading,
  searchQuery,
  statusFilter,
}) => {
  if (items.length === 0) {
    return (
      <div id="empty-msg" data-testid="empty-msg" className="empty-state">
        <p className="empty-title">No production orders found</p>
        <p className="empty-desc">
          {searchQuery || statusFilter !== 'ALL'
            ? 'No production orders match the current filter criteria.'
            : 'No production orders yet. Click "+ Add Production Order" to create one.'}
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table id="production-table" data-testid="production-table" className="data-table">
        <thead>
          <tr>
            <th
              id="col-prod-id"
              data-testid="col-prod-id"
              onClick={() => onSort('id')}
              className="sortable-header"
            >
              ID {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-prod-model"
              data-testid="col-prod-model"
              onClick={() => onSort('modelName')}
              className="sortable-header"
            >
              Model Name {sortField === 'modelName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-prod-quantity"
              data-testid="col-prod-quantity"
              onClick={() => onSort('quantity')}
              className="sortable-header"
            >
              Quantity {sortField === 'quantity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-prod-date"
              data-testid="col-prod-date"
              onClick={() => onSort('estimatedCompletionDate')}
              className="sortable-header"
            >
              Estimated Date{' '}
              {sortField === 'estimatedCompletionDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th
              id="col-prod-status"
              data-testid="col-prod-status"
              onClick={() => onSort('status')}
              className="sortable-header"
            >
              Status {sortField === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
            </th>
            <th className="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              id={`production-row-${item.id}`}
              data-testid={`production-row-${item.id}`}
            >
              <td className="cell-id">#{item.id}</td>
              <td className="cell-name">
                <strong>{item.modelName}</strong>
              </td>
              <td className="cell-count">
                <span className="badge badge-info">{item.quantity} pcs</span>
              </td>
              <td className="cell-date">{item.estimatedCompletionDate || 'N/A'}</td>
              <td className="cell-status">
                <span
                  className={`badge badge-status ${
                    item.status === 'Completed'
                      ? 'badge-success'
                      : item.status === 'In Progress'
                      ? 'badge-warning'
                      : 'badge-secondary'
                  }`}
                >
                  {item.status}
                </span>
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
                      id={`edit-prod-btn-${item.id}`}
                      data-testid={`edit-prod-btn-${item.id}`}
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
