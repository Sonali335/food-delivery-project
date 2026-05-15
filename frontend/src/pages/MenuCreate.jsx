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
  const [pickedFile, setPickedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setPickedFile(file || null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let imageUrl = null;
      if (pickedFile) {
        const uploaded = await uploadMenuImage(pickedFile);
        imageUrl = uploaded.url || null;
      }
      await createMenuItem({
        name,
        description,
        price: Number(price),
        categoryId,
        imageUrl,
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
          Image (optional — uploaded on save via Cloudinary)
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>
        {previewUrl ? (
          <img src={previewUrl} alt="" width={120} height={120} style={{ objectFit: "cover", borderRadius: 4 }} />
        ) : null}
        <button type="submit" disabled={saving || !categories.length}>
          {saving ? (pickedFile ? "Uploading & saving…" : "Saving…") : "Save"}
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
