import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import styles from "./pages.module.css";

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "unknown";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.success}>Logged in as: {role}</p>
      <div className={styles.actions}>
        <Button text="Log out" onClick={handleLogout} disabled={false} />
      </div>
    </div>
  );
}

export default Dashboard;
