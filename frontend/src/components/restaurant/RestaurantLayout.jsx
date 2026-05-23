import { useEffect, useState } from "react";
import { getStatus, updateStatus } from "../../api/restaurant";
import { getProfile } from "../../api/profile";
import RestaurantShell from "./RestaurantShell";

function RestaurantLayout({ children }) {
  const [restaurantName, setRestaurantName] = useState("");
  const [status, setStatus] = useState("open");
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [shellError, setShellError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShellError("");
      try {
        const [statusRes, profileRes] = await Promise.all([
          getStatus(),
          getProfile().catch(() => ({ profile: null })),
        ]);
        if (!cancelled) {
          setStatus(statusRes.status || "open");
          setRestaurantName(profileRes.profile?.restaurantName || "");
        }
      } catch (e) {
        if (!cancelled) setShellError(e.message || "Failed to load restaurant");
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyStatus = async (next) => {
    setStatusSaving(true);
    setShellError("");
    try {
      const data = await updateStatus(next);
      setStatus(data.status || next);
    } catch (e) {
      setShellError(e.message || "Could not update status");
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <RestaurantShell
      restaurantName={restaurantName}
      status={status}
      statusLoading={statusLoading}
      statusSaving={statusSaving}
      onSetStatus={applyStatus}
    >
      {shellError ? <div className="rd-alert-error">{shellError}</div> : null}
      {children}
    </RestaurantShell>
  );
}

export default RestaurantLayout;
