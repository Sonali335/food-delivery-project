import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { deleteProfile } from "../api/profile";
import styles from "./pages.module.css";

const SETUP_BY_ROLE = {
  customer: "/setup/customer",
  driver: "/setup/driver",
  restaurant: "/setup/restaurant",
};

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "unknown";
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const setupPath = SETUP_BY_ROLE[role];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleUpdateProfile = () => {
    if (setupPath) navigate(setupPath);
  };

  const handleDeleteProfile = async () => {
    setDeleteError("");
    const ok = window.confirm(
      "This will permanently delete your profile and account. Continue?"
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteProfile();
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.success}>Logged in as: {role}</p>
      {deleteError ? <div className={styles.error}>{deleteError}</div> : null}
      <div className={styles.actions}>
        <Button
          text="Update profile"
          onClick={handleUpdateProfile}
          disabled={!setupPath}
        />
        <Button
          text={deleting ? "Deleting..." : "Delete profile"}
          onClick={handleDeleteProfile}
          disabled={deleting || !setupPath}
        />
        <Button text="Log out" onClick={handleLogout} disabled={false} />
      </div>
    </div>
  );
}

export default Dashboard;
