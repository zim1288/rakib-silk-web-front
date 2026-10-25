import React from 'react';
import { ProductionStatus } from '../../types';

/**
 * Props contract for the ProductionOrderForm component.
 */
export interface ProductionOrderFormProps {
  /** Editing production ID, or null if creating new order */
  editingId: number | null;
  /** Saree model name */
  modelName: string;
  onModelNameChange: (val: string) => void;
  /** Quantity of sarees in this weaving batch */
  quantity: string;
  onQuantityChange: (val: string) => void;
  /** Estimated loom completion date (YYYY-MM-DD) */
  estimatedCompletionDate: string;
  onEstimatedCompletionDateChange: (val: string) => void;
  /** Batch status in the production lifecycle */
  status: ProductionStatus;
  onStatusChange: (val: ProductionStatus) => void;
  /** Validation error messages */
  nameError: string | null;
  quantityError: string | null;
  dateError: string | null;
  /** Global loading state */
  isLoading: boolean;
  /** Submit handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Cancel handler */
  onCancel: () => void;
}

/**
 * Form component for scheduling new loom runs or updating existing batch orders.
 * Includes inline validation for model names, positive piece counts, and deadline dates.
 */
export const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({
  editingId,
  modelName,
  onModelNameChange,
  quantity,
  onQuantityChange,
  estimatedCompletionDate,
  onEstimatedCompletionDateChange,
  status,
  onStatusChange,
  nameError,
  quantityError,
  dateError,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="inline-form-card">
      <div className="card-header">
        <h2 id="form-heading" data-testid="form-heading" className="card-title">
          {editingId !== null ? `Edit Production Order (#${editingId})` : 'New Production Order'}
        </h2>
      </div>

      <form id="production-form" data-testid="production-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="prod-model-input" className="form-label">
              Model Name <span className="required-mark">*</span>
            </label>
            <input
              id="prod-model-input"
              data-testid="prod-model-input"
              type="text"
              className={`form-input ${nameError ? 'input-error' : ''}`}
              placeholder="e.g. Benarasi Bridal Saree"
              value={modelName}
              onChange={(e) => onModelNameChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Required, maximum 50 characters</small>
            {nameError && (
              <span id="prod-name-error" className="field-error">
                {nameError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="prod-quantity-input" className="form-label">
              Quantity (pcs) <span className="required-mark">*</span>
            </label>
            <input
              id="prod-quantity-input"
              data-testid="prod-quantity-input"
              type="number"
              className={`form-input ${quantityError ? 'input-error' : ''}`}
              placeholder="e.g. 50"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Whole number greater than 0</small>
            {quantityError && (
              <span id="prod-quantity-error" className="field-error">
                {quantityError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="prod-date-input" className="form-label">
              Estimated Completion Date <span className="required-mark">*</span>
            </label>
            <input
              id="prod-date-input"
              data-testid="prod-date-input"
              type="date"
              className={`form-input ${dateError ? 'input-error' : ''}`}
              value={estimatedCompletionDate}
              onChange={(e) => onEstimatedCompletionDateChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Target completion deadline</small>
            {dateError && (
              <span id="prod-date-error" className="field-error">
                {dateError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="prod-status-select" className="form-label">
              Status <span className="required-mark">*</span>
            </label>
            <select
              id="prod-status-select"
              data-testid="prod-status-select"
              className="form-select"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as ProductionStatus)}
              disabled={isLoading}
              required
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <small className="field-helper">Current stage in the loom</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            id="save-prod-btn"
            data-testid="save-prod-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading
              ? 'Saving...'
              : editingId !== null
              ? 'Update Order'
              : 'Submit Production Order'}
          </button>
          <button
            id="cancel-prod-btn"
            data-testid="cancel-prod-btn"
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
