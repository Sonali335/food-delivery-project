import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { getStatus, updateStatus } from "../../api/restaurant";
import { getProfile } from "../../api/profile";
import RestaurantShell from "./RestaurantShell";
import { RestaurantProfileContext } from "./RestaurantProfileContext";

const CACHE_KEY = "food_delivery_restaurant_shell";

function readShellCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeShellCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function RestaurantLayout() {
  const cached = readShellCache();
  const [restaurantName, setRestaurantName] = useState(cached?.restaurantName ?? "");
  const [status, setStatus] = useState(cached?.status ?? "open");
  const [statusLoading, setStatusLoading] = useState(!cached?.restaurantName);
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
          const nextStatus = statusRes.status || "open";
          const nextName = profileRes.profile?.restaurantName || "";
          setStatus(nextStatus);
          setRestaurantName(nextName);
          writeShellCache({ restaurantName: nextName, status: nextStatus });
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
      const resolved = data.status || next;
      setStatus(resolved);
      writeShellCache({
        restaurantName,
        status: resolved,
      });
    } catch (e) {
      setShellError(e.message || "Could not update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const updateRestaurantName = (name) => {
    const trimmed = String(name ?? "").trim();
    setRestaurantName(trimmed);
    writeShellCache({ restaurantName: trimmed, status });
  };

  return (
    <RestaurantProfileContext.Provider
      value={{
        restaurantName,
        setRestaurantName: updateRestaurantName,
        status,
        setStatus,
        statusLoading,
        statusSaving,
        applyStatus,
      }}
    >
      <RestaurantShell
        restaurantName={restaurantName}
        status={status}
        statusLoading={statusLoading}
        statusSaving={statusSaving}
        onSetStatus={applyStatus}
      >
        {shellError ? <div className="rd-alert-error">{shellError}</div> : null}
        <Outlet />
      </RestaurantShell>
    </RestaurantProfileContext.Provider>
  );
}

export default RestaurantLayout;
