import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api/category";
import { createMenuItem, uploadMenuImage } from "../api/menu";

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
    <>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Add menu item</h1>
          <p className="rd-page-subtitle">Create a new dish for your restaurant menu.</p>
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
              {categories.length === 0 ? <option value="">Create a category first</option> : null}
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
          {previewUrl ? (
            <img
              src={previewUrl}
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
              {saving ? (pickedFile ? "Uploading & saving…" : "Saving…") : "Save item"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default MenuCreate;
