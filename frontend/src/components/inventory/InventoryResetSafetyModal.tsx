import React from 'react';

/**
 * Props contract for the InventoryResetSafetyModal component.
 */
export interface InventoryResetSafetyModalProps {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Total count of items that will be deleted */
  itemsCount: number;
  /** Whether the user checked 'Also hide this button after wipe' */
  alsoHideButton: boolean;
  onAlsoHideButtonChange: (checked: boolean) => void;
  /** Callback to just hide the button without wiping data */
  onHideButtonOnly: () => void;
  /** Callback to confirm and delete all items */
  onConfirmReset: () => void;
  /** Callback to cancel and close modal */
  onClose: () => void;
  /** Loading status */
  isLoading: boolean;
}

/**
 * High-security modal dialog preventing accidental inventory wipeouts.
 * Offers standard test wipe alongside persistent production-mode button hiding.
 */
export const InventoryResetSafetyModal: React.FC<InventoryResetSafetyModalProps> = ({
  isOpen,
  itemsCount,
  alsoHideButton,
  onAlsoHideButtonChange,
  onHideButtonOnly,
  onConfirmReset,
  onClose,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => !isLoading && onClose()}>
      <div
        className="reset-confirmation-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '1.75rem',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(112, 26, 45, 0.25)',
          border: '1.5px solid #fecaca',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <div>
            <h3
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1.25rem',
                color: '#991b1b',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
              }}
            >
              Reset All Inventory Data?
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#57534e', lineHeight: 1.55 }}>
              This action will permanently delete all <strong>{itemsCount}</strong> saree item(s)
              from your active inventory database. This cannot be undone.
            </p>
          </div>
        </div>

        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#92400e',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={alsoHideButton}
              onChange={(e) => onAlsoHideButtonChange(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#701a2d', cursor: 'pointer' }}
            />
            <span>Also hide this button after wipe (Production Mode)</span>
          </label>
          <span style={{ fontSize: '0.75rem', color: '#b45309', paddingLeft: '1.65rem' }}>
            Hides the button from staff so live stock is never accidentally wiped. You can re-enable
            it in Settings.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', padding: '0.45rem 0.85rem', color: '#78716c' }}
            onClick={onHideButtonOnly}
            disabled={isLoading}
            title="Hide the button now without deleting items"
          >
            Just Hide Button
          </button>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: '1px solid #991b1b',
                fontWeight: 600,
              }}
              onClick={onConfirmReset}
              disabled={isLoading}
            >
              {isLoading ? 'Wiping Data...' : 'Yes, Delete All Items'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
