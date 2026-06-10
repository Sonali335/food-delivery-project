import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../api/category";
import { createMenuItem, uploadMenuImage } from "../api/menu";
import MenuItemForm from "../components/restaurant/MenuItemForm";
import { DEFAULT_PREP_TIME } from "../utils/prepTime";

function MenuCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [prepTime, setPrepTime] = useState(DEFAULT_PREP_TIME);
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

  const handleClearImage = () => {
    setPickedFile(null);
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
        prepTime,
      });
      navigate("/restaurant/menu");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MenuItemForm
      title="Add menu item"
      subtitle="Create a new dish customers can order from your menu."
      categories={categories}
      name={name}
      description={description}
      price={price}
      categoryId={categoryId}
      prepTime={prepTime}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onPriceChange={setPrice}
      onCategoryChange={setCategoryId}
      onPrepTimeChange={setPrepTime}
      previewSrc={previewUrl}
      pickedFileName={pickedFile?.name}
      onFileChange={handleFileChange}
      onClearImage={handleClearImage}
      error={error}
      saving={saving}
      submitLabel="Save item"
      savingLabel={pickedFile ? "Uploading & saving…" : "Saving…"}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/restaurant/menu")}
    />
  );
}

export default MenuCreate;
