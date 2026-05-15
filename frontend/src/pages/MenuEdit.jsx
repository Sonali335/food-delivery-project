import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../api/category";
import { getMenuItem, updateMenuItem, uploadMenuImage } from "../api/menu";
import styles from "./pages.module.css";

function resolveCategoryIdField(raw) {
  if (raw && typeof raw === "object" && raw._id != null) return String(raw._id);
  if (raw != null) return String(raw);
  return "";
}

function MenuEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pickedFile, setPickedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const [catData, itemData] = await Promise.all([getCategories(), getMenuItem(id)]);
        if (cancelled) return;
        setCategories(catData.categories || []);
        const item = itemData.item;
        setName(item.name || "");
        setDescription(item.description || "");
        setPrice(String(item.price ?? ""));
        setCategoryId(resolveCategoryIdField(item.categoryId));
        setImageUrl(item.imageUrl || "");
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      let nextImageUrl = imageUrl || null;
      if (pickedFile) {
        const uploaded = await uploadMenuImage(pickedFile);
        nextImageUrl = uploaded.url || null;
      }
      await updateMenuItem(id, {
        name,
        description,
        price: Number(price),
        categoryId,
        imageUrl: nextImageUrl,
      });
      navigate("/restaurant/menu");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.hint}>Loading…</p>
      </div>
    );
  }

  const thumbSrc = previewUrl || imageUrl || null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Edit menu item</h1>
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
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          Image (optional — new file is uploaded on save via Cloudinary)
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>
        {thumbSrc ? (
          <img src={thumbSrc} alt="" width={120} height={120} style={{ objectFit: "cover", borderRadius: 4 }} />
        ) : null}
        <button type="submit" disabled={saving || !categories.length}>
          {saving ? (pickedFile ? "Uploading & saving…" : "Saving…") : "Save changes"}
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

export default MenuEdit;
