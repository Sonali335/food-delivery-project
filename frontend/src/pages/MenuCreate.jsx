import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../api/category";
import { createMenuItem, uploadMenuImage } from "../api/menu";
import styles from "./pages.module.css";

function MenuCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        const list = data.categories || [];
        if (!cancelled) {
          setCategories(list);
          if (list.length) {
            setCategoryId((prev) => prev || list[0]._id);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load categories");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const data = await uploadMenuImage(file);
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      setError(err.message || "Image upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createMenuItem({
        name,
        description,
        price: Number(price),
        categoryId,
        imageUrl: imageUrl || null,
      });
      navigate("/restaurant/menu");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Create menu item</h1>
      {error ? <div className={styles.error}>{error}</div> : null}
      <form onSubmit={handleSubmit} className={styles.cardGrid}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Name
          <input value={name} onChange={(ev) => setName(ev.target.value)} required />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Description
          <textarea value={description} onChange={(ev) => setDescription(ev.target.value)} rows={3} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(ev) => setPrice(ev.target.value)}
            required
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Category
          <select value={categoryId} onChange={(ev) => setCategoryId(ev.target.value)} required>
            {categories.length === 0 ? <option value="">Create a category first</option> : null}
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Image (placeholder upload)
          <input type="file" accept="image/*" onChange={handleImage} />
          {imageUrl ? <span className={styles.hint}>URL: {imageUrl}</span> : null}
        </label>
        <button type="submit" disabled={saving || !categories.length}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      <p className={styles.hint}>
        <Link className={styles.linkButton} to="/restaurant/menu">
          Cancel
        </Link>
      </p>
    </div>
  );
}

export default MenuCreate;
