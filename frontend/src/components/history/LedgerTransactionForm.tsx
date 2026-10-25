import React from 'react';
import { TransactionType } from '../../types';
import { validateModelName } from '../../utils/validation';

interface LedgerTransactionFormProps {
  type: TransactionType;
  setType: (type: TransactionType) => void;
  modelName: string;
  setModelName: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerNumber: string;
  setCustomerNumber: (val: string) => void;
  quantity: string;
  setQuantity: (val: string) => void;
  totalAmount: string;
  setTotalAmount: (val: string) => void;
  dateString: string;
  setDateString: (val: string) => void;
  nameError: string | null;
  setNameError: (val: string | null) => void;
  quantityError: string | null;
  amountError: string | null;
  dateError: string | null;
  setDateError: (val: string | null) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * LedgerTransactionForm Component
 *
 * An inline form for quickly recording commercial transactions:
 * - Supports SELL_OUT, PURCHASE_IN, HOUSE, and PRODUCTION types
 * - Captures model description, client contact details, pieces count, and total BDT amount
 * - Includes client-side input validation and error feedback
 */
export const LedgerTransactionForm: React.FC<LedgerTransactionFormProps> = ({
  type,
  setType,
  modelName,
  setModelName,
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
  quantity,
  setQuantity,
  totalAmount,
  setTotalAmount,
  dateString,
  setDateString,
  nameError,
  setNameError,
  quantityError,
  amountError,
  dateError,
  setDateError,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="inline-form-card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h2 id="form-heading" data-testid="form-heading" className="card-title">
          Record Commercial Transaction
        </h2>
      </div>

      <form id="transaction-form" data-testid="transaction-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          {/* Transaction Type */}
          <div className="form-group">
            <label htmlFor="transaction-type-select" className="form-label">
              Transaction Type <span className="required-mark">*</span>
            </label>
            <select
              id="transaction-type-select"
              data-testid="transaction-type-select"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              disabled={isLoading}
              required
            >
              <option value="SELL_OUT">SELL_OUT (Customer Sale)</option>
              <option value="PURCHASE_IN">PURCHASE_IN (Stock Inflow)</option>
              <option value="HOUSE">HOUSE (Internal / Household Stock)</option>
              <option value="PRODUCTION">PRODUCTION (Production Entry)</option>
            </select>
          </div>

          {/* Model Name */}
          <div className="form-group">
            <label htmlFor="transaction-model-input" className="form-label">
              Model Name <span className="required-mark">*</span>
            </label>
            <input
              id="transaction-model-input"
              data-testid="transaction-model-input"
              type="text"
              className={`form-input ${nameError ? 'input-error' : ''}`}
              placeholder="e.g. Pure Silk Katan"
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                if (nameError) setNameError(validateModelName(e.target.value));
              }}
              disabled={isLoading}
              required
            />
            {nameError && (
              <span id="transaction-name-error" className="field-error">
                {nameError}
              </span>
            )}
          </div>

          {/* Client / Counterparty Name */}
          <div className="form-group">
            <label htmlFor="transaction-customer-input" className="form-label">
              Client / Counterparty Name
            </label>
            <input
              id="transaction-customer-input"
              type="text"
              className="form-input"
              placeholder="e.g. Farhana Begum"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Client Phone Number */}
          <div className="form-group">
            <label htmlFor="transaction-phone-input" className="form-label">
              Client Phone Number
            </label>
            <input
              id="transaction-phone-input"
              type="text"
              className="form-input"
              placeholder="e.g. 017XXXXXXXX"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Quantity Pieces */}
          <div className="form-group">
            <label htmlFor="transaction-quantity-input" className="form-label">
              Pieces (Quantity) <span className="required-mark">*</span>
            </label>
            <input
              id="transaction-quantity-input"
              data-testid="transaction-quantity-input"
              type="number"
              min="1"
              className={`form-input ${quantityError ? 'input-error' : ''}`}
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (quantityError) setNameError(null);
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Total Amount BDT */}
          <div className="form-group">
            <label htmlFor="transaction-amount-input" className="form-label">
              Total Amount (BDT) <span className="required-mark">*</span>
            </label>
            <input
              id="transaction-amount-input"
              data-testid="transaction-amount-input"
              type="number"
              step="any"
              className={`form-input ${amountError ? 'input-error' : ''}`}
              placeholder="e.g. 15000"
              value={totalAmount}
              onChange={(e) => {
                setTotalAmount(e.target.value);
                if (amountError) setNameError(null);
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Transaction Date */}
          <div className="form-group form-group-full">
            <label htmlFor="transaction-date-input" className="form-label">
              Transaction Date (Format: date/month/year) <span className="required-mark">*</span>
            </label>
            <input
              id="transaction-date-input"
              data-testid="transaction-date-input"
              type="date"
              className={`form-input ${dateError ? 'input-error' : ''}`}
              value={dateString}
              onChange={(e) => {
                setDateString(e.target.value);
                if (dateError) setDateError(null);
              }}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            id="save-transaction-btn"
            data-testid="save-transaction-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Recording...' : 'Record Transaction'}
          </button>
          <button
            id="cancel-transaction-btn"
            data-testid="cancel-transaction-btn"
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
