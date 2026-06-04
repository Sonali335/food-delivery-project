import { useId, useRef } from "react";
import { Link } from "react-router-dom";

function MenuItemForm({
  title,
  subtitle,
  categories,
  name,
  description,
  price,
  categoryId,
  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  previewSrc,
  pickedFileName,
  onFileChange,
  onClearImage,
  error,
  saving,
  submitLabel,
  savingLabel,
  onSubmit,
  onCancel,
  submitDisabled,
}) {
  const fileInputId = useId();
  const fileRef = useRef(null);

  const clearPicked = () => {
    onClearImage?.();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <div className="rd-page-header">
        <div>
          <Link to="/restaurant/menu" className="rd-menu-form-back">
            <span className="material-symbols-outlined">arrow_back</span>
            Menu
          </Link>
          <h1 className="rd-page-title">{title}</h1>
          <p className="rd-page-subtitle">{subtitle}</p>
        </div>
      </div>

      {error ? <div className="rd-alert-error">{error}</div> : null}

      {categories.length === 0 ? (
        <div className="rd-alert-error rd-menu-form-no-cat">
          Add at least one category before creating menu items.{" "}
          <Link to="/restaurant/categories">Go to Categories</Link>
        </div>
      ) : null}

      <div className="rd-menu-form-card">
        <form className="rd-menu-form" onSubmit={onSubmit}>
          <div className="rd-menu-form-main">
            <div className="rd-menu-form-fields">
              <div className="rd-form-field">
                <label htmlFor="menuName">Name</label>
                <input
                  id="menuName"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g. Margherita Pizza"
                  required
                />
              </div>
              <div className="rd-form-field">
                <label htmlFor="menuDescription">Description</label>
                <textarea
                  id="menuDescription"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={4}
                  placeholder="Ingredients, size, or notes for customers"
                />
              </div>
              <div className="rd-menu-form-row">
                <div className="rd-form-field">
                  <label htmlFor="menuPrice">Price ($)</label>
                  <input
                    id="menuPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => onPriceChange(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="rd-form-field">
                  <label htmlFor="menuCategory">Category</label>
                  <select
                    id="menuCategory"
                    value={categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    required
                    disabled={!categories.length}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rd-menu-form-media">
              <p className="rd-menu-form-media-label">Photo</p>
              <div className={`rd-menu-image-zone ${previewSrc ? "rd-menu-image-zone-has" : ""}`}>
                {previewSrc ? (
                  <img className="rd-menu-image-preview" src={previewSrc} alt="" />
                ) : (
                  <div className="rd-menu-image-placeholder">
                    <span className="material-symbols-outlined">add_photo_alternate</span>
                    <span>Optional</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                id={fileInputId}
                className="rd-menu-image-input"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
              <div className="rd-menu-image-actions">
                <label htmlFor={fileInputId} className="rd-btn-outline rd-menu-image-btn">
                  {previewSrc ? "Change photo" : "Upload photo"}
                </label>
                {previewSrc ? (
                  <button type="button" className="rd-menu-image-remove" onClick={clearPicked}>
                    Remove
                  </button>
                ) : null}
              </div>
              {pickedFileName ? (
                <p className="rd-menu-image-filename">{pickedFileName}</p>
              ) : (
                <p className="rd-menu-image-hint">JPG or PNG, up to a few MB.</p>
              )}
            </div>
          </div>

          <div className="rd-menu-form-footer">
            <button type="button" className="rd-btn-outline" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="rd-btn-primary"
              disabled={submitDisabled || saving || !categories.length}
            >
              <span className="material-symbols-outlined">save</span>
              {saving ? savingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default MenuItemForm;
