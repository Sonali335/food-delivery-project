import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMenuItems, deleteMenuItem } from "../api/menu";

function categoryName(item) {
  const c = item.categoryId;
  if (c && typeof c === "object" && c.name) return c.name;
  return "—";
}

function categoryKey(item) {
  const c = item.categoryId;
  if (c && typeof c === "object" && c._id) return String(c._id);
  if (c != null) return String(c);
  return "";
}

function matchesMenuSearch(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = (item.name || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();
  const cat = categoryName(item).toLowerCase();
  const price = String(item.price ?? "");
  return name.includes(q) || desc.includes(q) || cat.includes(q) || price.includes(q);
}

function MenuList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const categoryChips = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = categoryKey(item) || categoryName(item);
      if (!map.has(key)) {
        map.set(key, categoryName(item));
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  const counts = useMemo(() => {
    const base = { all: items.length };
    for (const chip of categoryChips) {
      base[chip.id] = items.filter((item) => categoryKey(item) === chip.id).length;
    }
    return base;
  }, [items, categoryChips]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && categoryKey(item) !== categoryFilter) {
        return false;
      }
      return matchesMenuSearch(item, search);
    });
  }, [items, categoryFilter, search]);

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const ok = window.confirm("Delete this menu item?");
    if (!ok) return;
    setError("");
    try {
      await deleteMenuItem(id);
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  return (
    <>
      <header className="rd-page-header rd-menu-list-header">
        <div>
          <h1 className="rd-page-title">Menu management</h1>
          <p className="rd-page-subtitle">
            Add, edit, and organize items customers see when ordering.
          </p>
        </div>
        <div className="rd-header-actions rd-menu-list-toolbar">
          <div className="rd-oh-search-wrap">
            <span className="material-symbols-outlined rd-oh-search-icon">search</span>
            <input
              type="search"
              className="rd-oh-search"
              placeholder="Search by name, category, price…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search menu items"
              disabled={loading || items.length === 0}
            />
          </div>
          <button
            type="button"
            className="rd-btn-primary"
            onClick={() => navigate("/restaurant/menu/create")}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add new item
          </button>
        </div>
      </header>

      {error ? <div className="rd-alert-error">{error}</div> : null}

      {loading ? (
        <p className="rd-empty">Loading menu…</p>
      ) : items.length === 0 ? (
        <div className="rd-panel rd-menu-empty-panel">
          <div className="rd-menu-empty">
            <span className="rd-menu-empty-icon" aria-hidden>
              <span className="material-symbols-outlined">restaurant_menu</span>
            </span>
            <p className="rd-menu-empty-title">No menu items yet</p>
            <p className="rd-menu-empty-text">
              Use <strong>Add new item</strong> above to create your first dish.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rd-oh-chips rd-menu-list-chips">
            <button
              type="button"
              className={`rd-oh-chip ${categoryFilter === "all" ? "rd-oh-chip-active" : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              All ({counts.all ?? 0})
            </button>
            {categoryChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`rd-oh-chip ${categoryFilter === chip.id ? "rd-oh-chip-active" : ""}`}
                onClick={() => setCategoryFilter(chip.id)}
              >
                {chip.name} ({counts[chip.id] ?? 0})
              </button>
            ))}
          </div>

          <div className="rd-oh-table-panel">
            <div className="rd-oh-table-scroll">
              <table className="rd-oh-table rd-menu-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="rd-oh-table-empty">
                        No items match your search or category filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item._id} className="rd-menu-table-row">
                        <td>
                          <div className="rd-menu-table-item">
                            {item.imageUrl ? (
                              <img
                                className="rd-menu-table-thumb"
                                src={item.imageUrl}
                                alt=""
                              />
                            ) : (
                              <span className="rd-menu-table-thumb rd-menu-table-thumb-empty">
                                <span className="material-symbols-outlined">restaurant</span>
                              </span>
                            )}
                            <div className="rd-menu-table-item-text">
                              <span className="rd-menu-table-name">{item.name}</span>
                              {item.description ? (
                                <span className="rd-menu-table-desc">{item.description}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="rd-menu-table-category">{categoryName(item)}</td>
                        <td className="rd-menu-table-price">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={
                              item.isAvailable === false
                                ? "rd-menu-table-badge rd-menu-table-badge-off"
                                : "rd-menu-table-badge rd-menu-table-badge-on"
                            }
                          >
                            {item.isAvailable === false ? "Unavailable" : "Available"}
                          </span>
                        </td>
                        <td>
                          <div className="rd-menu-table-actions">
                            <button
                              type="button"
                              className="rd-btn-outline rd-menu-table-btn"
                              onClick={() => navigate(`/restaurant/menu/edit/${item._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rd-menu-table-delete"
                              onClick={(e) => handleDelete(item._id, e)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="rd-menu-table-footer">
              <p className="rd-menu-table-footer-text">
                {filteredItems.length === items.length
                  ? `Showing ${items.length} ${items.length === 1 ? "item" : "items"}`
                  : `Showing ${filteredItems.length} of ${items.length} items`}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default MenuList;
