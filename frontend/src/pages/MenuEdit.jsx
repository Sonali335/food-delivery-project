import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../api/category";
import { getMenuItem, updateMenuItem, uploadMenuImage } from "../api/menu";
import MenuItemForm from "../components/restaurant/MenuItemForm";

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

  const handleClearImage = () => {
    setPickedFile(null);
    setImageUrl("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
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

  const displayPreview = previewUrl || imageUrl || null;

  if (loading) {
    return <p className="rd-empty">Loading…</p>;
  }

  return (
    <MenuItemForm
      title="Edit menu item"
      subtitle="Update name, price, category, or photo for this dish."
      categories={categories}
      name={name}
      description={description}
      price={price}
      categoryId={categoryId}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onPriceChange={setPrice}
      onCategoryChange={setCategoryId}
      previewSrc={displayPreview}
      pickedFileName={pickedFile?.name}
      onFileChange={handleFileChange}
      onClearImage={handleClearImage}
      error={error}
      saving={saving}
      submitLabel="Save changes"
      savingLabel={pickedFile ? "Uploading & saving…" : "Saving…"}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/restaurant/menu")}
    />
  );
}

export default MenuEdit;
