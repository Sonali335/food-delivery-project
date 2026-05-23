import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMenuItems, deleteMenuItem } from "../api/menu";
import RestaurantLayout from "../components/restaurant/RestaurantLayout";

function categoryName(item) {
  const c = item.categoryId;
  if (c && typeof c === "object" && c.name) return c.name;
  return "—";
}

function MenuList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    try {
      const data = await getMenuItems();
      setItems(data.items || []);
    } catch (e) {
      setError(e.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this menu item?");
    if (!ok) return;
    setError("");
    try {
      await deleteMenuItem(id);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  };

  return (
    <RestaurantLayout>
      <div className="rd-page-header">
        <div>
          <h1 className="rd-page-title">Menu management</h1>
          <p className="rd-page-subtitle">
            Add, edit, and organize items customers see when ordering.
          </p>
        </div>
        <div className="rd-header-actions">
          <button
            type="button"
            className="rd-btn-primary"
            onClick={() => navigate("/restaurant/menu/create")}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add new item
          </button>
        </div>
      </div>

      {error ? <div className="rd-alert-error">{error}</div> : null}

      {loading ? (
        <p className="rd-empty">Loading menu…</p>
      ) : items.length === 0 ? (
        <div className="rd-panel">
          <p className="rd-empty">No menu items yet. Add your first dish to get started.</p>
          <button
            type="button"
            className="rd-btn-primary"
            style={{ margin: "0 auto", display: "flex" }}
            onClick={() => navigate("/restaurant/menu/create")}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add new item
          </button>
        </div>
      ) : (
        <div className="rd-menu-grid">
          {items.map((item) => (
            <article key={item._id} className="rd-menu-card">
              <div className="rd-menu-card-image-wrap">
                {item.imageUrl ? (
                  <img className="rd-menu-card-image" src={item.imageUrl} alt="" />
                ) : (
                  <div className="rd-menu-card-placeholder">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                )}
                {!item.isAvailable ? (
                  <span className="rd-menu-card-badge-unavailable">Unavailable</span>
                ) : null}
              </div>
              <div className="rd-menu-card-body">
                <div className="rd-menu-card-top">
                  <h3 className="rd-menu-card-title">{item.name}</h3>
                  <span className="rd-menu-card-price">${Number(item.price).toFixed(2)}</span>
                </div>
                <p className="rd-menu-card-category">{categoryName(item)}</p>
                {item.description ? (
                  <p className="rd-menu-card-desc">{item.description}</p>
                ) : null}
                <div className="rd-menu-card-actions">
                  <button
                    type="button"
                    className="rd-btn-outline"
                    onClick={() => navigate(`/restaurant/menu/edit/${item._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rd-menu-card-delete"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </RestaurantLayout>
  );
}

export default MenuList;
