import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Props contract for the ProductionHeader component.
 */
export interface ProductionHeaderProps {
  /** Whether the creation form is currently open */
  isFormVisible: boolean;
  /** Callback to trigger opening the order creation form */
  onOpenAddForm: () => void;
  /** Global loading state */
  isLoading: boolean;
}

/**
 * Top executive header for Saree Loom Production.
 * Displays page heading, workflow subtitle, and the 'Add Production Order' action.
 */
export const ProductionHeader: React.FC<ProductionHeaderProps> = ({
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
          <span className="breadcrumb-current">Production</span>
        </div>
        <h1 id="page-title" data-testid="page-title" className="page-heading">
          Production
        </h1>
        <p className="page-description">
          Track saree weaving, batch manufacturing batches and completion deadlines
        </p>
      </div>
      <div className="header-actions">
        {!isFormVisible && (
          <button
            id="add-prod-btn"
            data-testid="add-prod-btn"
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddForm}
            disabled={isLoading}
          >
            + Add Production Order
          </button>
        )}
      </div>
    </div>
  );
};
