import { useNavigate } from "react-router-dom";
import styles from "./pages.module.css";

function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Food delivery</h1>
      <p className={styles.hint}>Choose how you want to continue.</p>
      <div className={styles.cardGrid}>
        <button
          type="button"
          className={styles.roleCard}
          onClick={() => navigate("/signup?role=customer")}
        >
          Continue as Customer
        </button>
        <button
          type="button"
          className={styles.roleCard}
          onClick={() => navigate("/signup?role=driver")}
        >
          Continue as Driver
        </button>
        <button
          type="button"
          className={styles.roleCard}
          onClick={() => navigate("/signup?role=restaurant")}
        >
          Continue as Restaurant
        </button>
      </div>
    </div>
  );
}

export default RoleSelect;
