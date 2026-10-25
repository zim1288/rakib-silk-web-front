import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Props contract for the InventoryHeader component.
 */
export interface InventoryHeaderProps {
  /** Flag indicating whether the test data reset button should be hidden */
  isResetButtonHidden: boolean;
  /** Callback triggered when user clicks 'Reset my test data' */
  onOpenResetModal: () => void;
  /** Flag indicating whether the Add / Edit form is currently active */
  isFormVisible: boolean;
  /** Callback triggered when user clicks '+ Add Saree Item' */
  onOpenAddForm: () => void;
  /** Loading status of any ongoing backend operation */
  isLoading: boolean;
}

/**
 * Top executive header component for the Saree Inventory module.
 * Displays page heading, operational subtitle, and primary action buttons.
 */
export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  isResetButtonHidden,
  onOpenResetModal,
  isFormVisible,
  onOpenAddForm,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <div className="page-header-row">
      <div>
        <div className="header-breadcrumbs">
          <button
            type="button"
            className="back-to-dashboard-btn"
            onClick={() => navigate('/')}
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Inventory</span>
        </div>
        <h1 id="page-title" data-testid="page-title" className="page-heading">
          Inventory
        </h1>
        <p className="page-description">Manage saree stock, models, pricing, and quantities</p>
      </div>
      <div className="header-actions">
        {!isResetButtonHidden && (
          <button
            id="reset-data-btn"
            data-testid="reset-data-btn"
            type="button"
            className="btn btn-warning"
            onClick={onOpenResetModal}
            disabled={isLoading}
            title="Reset sample inventory items (Testing only)"
          >
            Reset my test data
          </button>
        )}
        {!isFormVisible && (
          <button
            id="add-item-btn"
            data-testid="add-item-btn"
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddForm}
            disabled={isLoading}
          >
            + Add Saree Item
          </button>
        )}
      </div>
    </div>
  );
};
