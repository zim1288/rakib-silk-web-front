import React from 'react';

export interface CustomerEditModalProps {
  editName: string;
  onEditNameChange: (val: string) => void;
  editNumber: string;
  onEditNumberChange: (val: string) => void;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  errorMessage?: string | null;
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  editName,
  onEditNameChange,
  editNumber,
  onEditNumberChange,
  isSaving,
  onClose,
  onSave,
  errorMessage,
}) => {
  return (
    <div className="modal-backdrop edit-dialog-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-box edit-customer-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3>Edit Customer Profile</h3>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <p className="edit-dialog-desc">
            Updating this profile will synchronize all past and future transaction records for this
            client in your live database.
          </p>

          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="customer-edit-name">Customer / Boutique Name</label>
            <input
              id="customer-edit-name"
              type="text"
              className="input-field"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              placeholder="e.g. Begum Rokeya Boutique"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="customer-edit-phone">Customer Phone Number</label>
            <input
              id="customer-edit-phone"
              type="tel"
              className="input-field"
              value={editNumber}
              onChange={(e) => onEditNumberChange(e.target.value)}
              placeholder="e.g. +880 1711-234567"
              disabled={isSaving}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                color: '#be123c',
                fontSize: '0.85rem',
                marginTop: '0.85rem',
                fontWeight: 600,
                background: '#fff1f2',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #fecdd3',
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-crimson"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving & Syncing...' : 'Save & Sync to Database'}
          </button>
        </div>
      </div>
    </div>
  );
};
