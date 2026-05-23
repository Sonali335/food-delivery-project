import { useEffect, useState } from "react";
import { getCategories, createCategory, deleteCategory } from "../api/category";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError("");
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (e) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createCategory({ name: name.trim() });
      setName("");
      await load();
    } catch (err) {
      setError(err.message || "Could not add category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this category?");
    if (!ok) return;
    setError("");
    try {
      await deleteCategory(id);
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  return (
    <RestaurantLayout>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Categories</h1>
          <p className="rd-page-subtitle">
            Group menu items into categories customers can browse.
          </p>
        </div>
      </div>

      {error ? <div className="rd-alert-error">{error}</div> : null}

      <div className="rd-category-add-panel">
        <form className="rd-category-add-form" onSubmit={handleAdd}>
          <div className="rd-form-field" style={{ marginBottom: 0, flex: 1 }}>
            <label htmlFor="categoryName">New category name</label>
            <input
              id="categoryName"
              type="text"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder="e.g. Appetizers, Mains, Drinks"
            />
          </div>
          <button type="submit" className="rd-btn-primary" disabled={saving || !name.trim()}>
            <span className="material-symbols-outlined">add</span>
            {saving ? "Adding…" : "Add category"}
          </button>
        </form>
      </div>

      <div className="rd-panel">
        <div className="rd-panel-header">
          <h3 className="rd-panel-title">Your categories</h3>
          {!loading ? (
            <span className="rd-category-count">{categories.length} total</span>
          ) : null}
        </div>

        {loading ? (
          <p className="rd-empty">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="rd-empty">No categories yet. Add one above to organize your menu.</p>
        ) : (
          <ul className="rd-category-list">
            {categories.map((c) => (
              <li key={c._id} className="rd-category-item">
                <div className="rd-category-item-left">
                  <span className="rd-category-icon-wrap">
                    <span className="material-symbols-outlined">category</span>
                  </span>
                  <span className="rd-category-name">{c.name}</span>
                </div>
                <button
                  type="button"
                  className="rd-menu-card-delete"
                  onClick={() => handleDelete(c._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </RestaurantLayout>
  );
}

export default CategoryManager;
