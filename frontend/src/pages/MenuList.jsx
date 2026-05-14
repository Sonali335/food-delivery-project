import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMenuItems, deleteMenuItem } from "../api/menu";
import Button from "../components/Button";
import styles from "./pages.module.css";

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
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <span>
                {item.name} — ${item.price} {item.isAvailable ? "" : "(unavailable)"}
              </span>
              <div className={styles.actions}>
                <Button text="Edit" onClick={() => navigate(`/restaurant/menu/edit/${item._id}`)} disabled={false} />
                <Button text="Delete" onClick={() => handleDelete(item._id)} disabled={false} />
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
