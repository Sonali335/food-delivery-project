import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../api/category";
import { getMenuItem, updateMenuItem, uploadMenuImage } from "../api/menu";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

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
        if (!cancelled) setError(e.message || "Failed to load item");
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

  const thumbSrc = previewUrl || imageUrl || null;

  if (loading) {
    return (
      <RestaurantLayout>
        <p className="rd-empty">Loading…</p>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Edit menu item</h1>
          <p className="rd-page-subtitle">Update details for this dish.</p>
        </div>
      </div>

      {error ? <div className="rd-alert-error">{error}</div> : null}

      <div className="rd-form-panel">
        <form onSubmit={handleSubmit}>
          <div className="rd-form-field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(ev) => setName(ev.target.value)} required />
          </div>
          <div className="rd-form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={3}
            />
          </div>
          <div className="rd-form-field">
            <label htmlFor="price">Price</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
              required
            />
          </div>
          <div className="rd-form-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={categoryId}
              onChange={(ev) => setCategoryId(ev.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rd-form-field">
            <label htmlFor="image">Image (optional)</label>
            <input id="image" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              width={120}
              height={120}
              style={{ objectFit: "cover", borderRadius: 8, marginBottom: "1rem" }}
            />
          ) : null}
          <div className="rd-form-actions">
            <button type="button" className="rd-btn-outline" onClick={() => navigate("/restaurant/menu")}>
              Cancel
            </button>
            <button type="submit" className="rd-btn-primary" disabled={saving || !categories.length}>
              {saving ? (pickedFile ? "Uploading & saving…" : "Saving…") : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </RestaurantLayout>
  );
}

export default MenuEdit;
