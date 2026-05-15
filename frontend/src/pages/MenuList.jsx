import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMenuItems, deleteMenuItem } from "../api/menu";
import Button from "../components/Button";
import styles from "./pages.module.css";

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
    <div className={styles.page}>
      <h1 className={styles.title}>Menu items</h1>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.actions}>
        <Button text="Add new item" onClick={() => navigate("/restaurant/menu/create")} disabled={false} />
      </div>
      {loading ? (
        <p className={styles.hint}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={styles.hint}>No items yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((item) => (
            <li
              key={item._id}
              style={{
                borderBottom: "1px solid #d6d3d1",
                padding: "0.75rem 0",
                display: "flex",
                flexDirection: "row",
                gap: "0.75rem",
                alignItems: "flex-start",
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  style={{ objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#e7e5e4",
                    borderRadius: 4,
                    flexShrink: 0,
                    fontSize: "0.65rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#78716c",
                  }}
                >
                  No image
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className={styles.hint} style={{ margin: "0.25rem 0" }}>
                  {categoryName(item)}
                </div>
                <div>
                  ${Number(item.price).toFixed(2)}
                  {item.isAvailable ? "" : " · unavailable"}
                </div>
                <div className={styles.actions} style={{ marginTop: "0.5rem" }}>
                  <Button
                    text="Edit"
                    onClick={() => navigate(`/restaurant/menu/edit/${item._id}`)}
                    disabled={false}
                  />
                  <Button text="Delete" onClick={() => handleDelete(item._id)} disabled={false} />
                </div>
              </div>
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

export default MenuList;
