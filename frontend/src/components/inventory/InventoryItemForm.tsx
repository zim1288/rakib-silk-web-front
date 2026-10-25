import React, { useRef } from 'react';

/**
 * Props contract for the InventoryItemForm component.
 */
export interface InventoryItemFormProps {
  /** ID of item being edited, or null if creating a new item */
  editingId: number | null;
  /** Saree model name */
  modelName: string;
  onModelNameChange: (val: string) => void;
  /** Brand or fabric category (e.g. Silk, Katan, Benarasi) */
  brandCategory: string;
  onBrandCategoryChange: (val: string) => void;
  /** Unit price in BDT */
  unitPrice: string;
  onUnitPriceChange: (val: string) => void;
  /** Saree piece count available in stock */
  pieceCount: string;
  onPieceCountChange: (val: string) => void;
  /** Image URL or compressed base64 data string */
  imageUrl: string;
  onImageUrlChange: (val: string) => void;
  /** Field validation errors */
  nameError: string | null;
  priceError: string | null;
  countError: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Form cancellation handler */
  onCancel: () => void;
  /** Callback for error alerts during photo upload */
  onError: (msg: string) => void;
}

/**
 * Inline saree stock creation and editing form.
 * Supports device camera/gallery file selection with client-side canvas compression,
 * direct image URL pasting, and real-time field validation.
 */
export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  editingId,
  modelName,
  onModelNameChange,
  brandCategory,
  onBrandCategoryChange,
  unitPrice,
  onUnitPriceChange,
  pieceCount,
  onPieceCountChange,
  imageUrl,
  onImageUrlChange,
  nameError,
  priceError,
  countError,
  isLoading,
  onSubmit,
  onCancel,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Reads image from device, resizes down to max 800x800 via canvas,
   * and encodes as high-efficiency JPEG data URL.
   */
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onImageUrlChange(compressedDataUrl);
        } else {
          onImageUrlChange(result);
        }
      };
      img.onerror = () => {
        onImageUrlChange(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="inline-form-card">
      <div className="card-header">
        <h2 id="form-heading" data-testid="form-heading" className="card-title">
          {editingId !== null ? `Edit Saree Item (#${editingId})` : 'Add New Saree Item'}
        </h2>
      </div>

      <form id="inventory-form" data-testid="inventory-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="item-name-input" className="form-label">
              Model Name <span className="required-mark">*</span>
            </label>
            <input
              id="item-name-input"
              data-testid="item-name-input"
              type="text"
              className={`form-input ${nameError ? 'input-error' : ''}`}
              placeholder="e.g. Jamdani Gold Zari"
              value={modelName}
              onChange={(e) => onModelNameChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Required, maximum 50 characters</small>
            {nameError && (
              <span id="item-name-error" className="field-error">
                {nameError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="item-category-input" className="form-label">
              Brand / Category
            </label>
            <input
              id="item-category-input"
              data-testid="item-category-input"
              type="text"
              className="form-input"
              placeholder="e.g. Silk, Katan, Benarasi"
              value={brandCategory}
              onChange={(e) => onBrandCategoryChange(e.target.value)}
              disabled={isLoading}
            />
            <small className="field-helper">Saree category or fabric weave</small>
          </div>

          <div className="form-group">
            <label htmlFor="item-price-input" className="form-label">
              Unit Price (BDT) <span className="required-mark">*</span>
            </label>
            <input
              id="item-price-input"
              data-testid="item-price-input"
              type="number"
              step="any"
              className={`form-input ${priceError ? 'input-error' : ''}`}
              placeholder="e.g. 3500"
              value={unitPrice}
              onChange={(e) => onUnitPriceChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Number greater than 0</small>
            {priceError && (
              <span id="item-price-error" className="field-error">
                {priceError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="item-count-input" className="form-label">
              Piece Count <span className="required-mark">*</span>
            </label>
            <input
              id="item-count-input"
              data-testid="item-count-input"
              type="number"
              className={`form-input ${countError ? 'input-error' : ''}`}
              placeholder="e.g. 15"
              value={pieceCount}
              onChange={(e) => onPieceCountChange(e.target.value)}
              disabled={isLoading}
              required
            />
            <small className="field-helper">Whole number greater than 0</small>
            {countError && (
              <span id="item-count-error" className="field-error">
                {countError}
              </span>
            )}
          </div>

          {/* Saree Photo (Choose from Device or Enter Image URL) */}
          <div className="photo-upload-container">
            <span className="photo-upload-heading">
              Saree Photo (Choose from Device or Enter Image URL)
            </span>

            <div className="photo-upload-options">
              <div className="photo-device-side">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDeviceImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="device-photo-input"
                />
                <button
                  type="button"
                  className="btn-select-photo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <span role="img" aria-label="camera" className="camera-icon">📷</span>
                  <span>Select Photo from Device</span>
                </button>
                <span className="photo-helper-text">
                  Picks directly from your phone gallery or computer
                </span>
              </div>

              <div className="photo-or-divider">
                <span className="photo-or-pill">OR</span>
              </div>

              <div className="photo-url-side">
                <label htmlFor="item-image-input" className="photo-url-label">
                  Paste Image Web URL:
                </label>
                <input
                  id="item-image-input"
                  data-testid="item-image-input"
                  type="url"
                  className="form-input"
                  placeholder="e.g. https://example.com/saree-photo.jpg"
                  value={imageUrl}
                  onChange={(e) => onImageUrlChange(e.target.value)}
                  disabled={isLoading}
                />
                <span className="photo-helper-text">
                  Optional web link to saree image
                </span>
              </div>
            </div>

            {imageUrl && (
              <div className="photo-preview-box">
                <img
                  src={imageUrl}
                  alt="Saree Preview"
                  className="photo-preview-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🥻</text></svg>';
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4c0519' }}>
                    Photo Selected / Ready
                  </span>
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={() => onImageUrlChange('')}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            id="save-item-btn"
            data-testid="save-item-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : editingId !== null ? 'Update Saree' : 'Save Saree'}
          </button>
          <button
            id="cancel-item-btn"
            data-testid="cancel-item-btn"
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
