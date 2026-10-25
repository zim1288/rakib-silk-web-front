import React from 'react';
import { InventoryItem } from '../../types';

/**
 * Props contract for the InventoryImageModal component.
 */
export interface InventoryImageModalProps {
  /** The inventory item currently being previewed */
  previewItem: InventoryItem;
  /** Whether the image is currently displayed at 100% natural resolution */
  isOriginalSize: boolean;
  onToggleOriginalSize: () => void;
  /** The natural dimensions of the loaded image */
  imageNaturalSize: { width: number; height: number } | null;
  onImageLoad: (dimensions: { width: number; height: number }) => void;
  /** Callback to close the preview modal */
  onClose: () => void;
}

/**
 * High-definition saree image modal panel.
 * Enables close inspection of delicate silk zari weaves, fabrics, and embroideries
 * with 100% native resolution zooming and full viewport fitting.
 */
export const InventoryImageModal: React.FC<InventoryImageModalProps> = ({
  previewItem,
  isOriginalSize,
  onToggleOriginalSize,
  imageNaturalSize,
  onImageLoad,
  onClose,
}) => {
  return (
    <div id="image-preview-panel" data-testid="image-preview-panel" className="image-preview-panel">
      <div className="preview-panel-header">
        <div className="preview-panel-info">
          <span className="preview-panel-kicker">Full Resolution Saree Viewer</span>
          <h3 id="preview-title" data-testid="preview-title" className="preview-panel-title">
            {previewItem.modelName}
          </h3>
          <div className="preview-panel-badges">
            <span className="badge badge-light">{previewItem.brandCategory || 'Silk'}</span>
            <span className="badge badge-success">৳{previewItem.unitPrice.toLocaleString()}</span>
            <span className="badge badge-info">{previewItem.pieceCount} pcs in stock</span>
            {imageNaturalSize && (
              <span
                className="badge badge-warning"
                id="image-dimensions-badge"
                data-testid="image-dimensions-badge"
              >
                Original: {imageNaturalSize.width} × {imageNaturalSize.height} px
              </span>
            )}
          </div>
        </div>
        <div className="preview-panel-actions">
          {previewItem.imageUrl && (
            <>
              <button
                type="button"
                id="toggle-zoom-btn"
                data-testid="toggle-zoom-btn"
                className="btn btn-sm btn-primary"
                onClick={onToggleOriginalSize}
                title="Toggle between full 100% resolution and fit view"
              >
                {isOriginalSize ? '⤢ Fit Screen' : '🔍 100% Original Size'}
              </button>
              <a
                href={previewItem.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-secondary"
                title="Open source image file directly in a new browser tab"
              >
                Open Raw Image ↗
              </a>
            </>
          )}
          <button
            type="button"
            id="close-preview-btn"
            data-testid="close-preview-btn"
            className="btn btn-sm btn-danger"
            onClick={onClose}
          >
            ✕ Close Preview
          </button>
        </div>
      </div>
      <div className={`preview-panel-body ${isOriginalSize ? 'body-scrollable-fullres' : ''}`}>
        {previewItem.imageUrl ? (
          <div className="preview-img-container">
            <img
              src={previewItem.imageUrl}
              alt={previewItem.modelName}
              className={`preview-panel-img ${isOriginalSize ? 'img-100-percent' : 'img-fit'}`}
              id="preview-large-img"
              data-testid="preview-large-img"
              onClick={onToggleOriginalSize}
              onLoad={(e) => {
                const img = e.currentTarget;
                onImageLoad({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              title={
                isOriginalSize
                  ? 'Click to fit screen'
                  : 'Click to zoom to 100% original uploaded resolution'
              }
            />
            <div className="zoom-hint">
              {isOriginalSize
                ? 'Displaying at 100% natural resolution. Scroll/drag to pan across the saree.'
                : 'Click image or use "100% Original Size" to view in uncompressed uploaded resolution.'}
            </div>
          </div>
        ) : (
          <div className="preview-panel-empty">No image URL configured for this saree.</div>
        )}
      </div>
    </div>
  );
};
