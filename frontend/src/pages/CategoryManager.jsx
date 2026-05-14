import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, createCategory, deleteCategory } from "../api/category";
import styles from "./pages.module.css";

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
    <div className={styles.page}>
      <h1 className={styles.title}>Categories</h1>
      {error ? <div className={styles.error}>{error}</div> : null}
      <form onSubmit={handleAdd} className={styles.cardGrid} style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          New category name
          <input value={name} onChange={(ev) => setName(ev.target.value)} />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add category"}
        </button>
      </form>
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : categories.length === 0 ? (
        <p className={styles.hint}>No categories yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {categories.map((c) => (
            <li
              key={c._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #d6d3d1",
                padding: "0.5rem 0",
              }}
            >
              <span>{c.name}</span>
              <button type="button" onClick={() => handleDelete(c._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link className={styles.linkButton} to="/restaurant/dashboard">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

export default CategoryManager;
