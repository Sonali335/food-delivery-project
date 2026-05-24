import { useEffect, useState } from "react";
import { getProfile } from "../../api/profile";
import DriverShell from "./DriverShell";
import { DriverProfileContext } from "./DriverProfileContext";

function DriverLayout({ children }) {
  const [driverName, setDriverName] = useState("Driver");
  const [isOnline, setIsOnline] = useState(false);
  const [ratingAverage, setRatingAverage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [shellError, setShellError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShellError("");
      try {
        const { profile } = await getProfile();
        if (!cancelled) {
          setDriverName(profile?.username?.trim() || "Driver");
          setIsOnline((profile?.availabilityStatus || "offline") === "online");
          setRatingAverage(profile?.ratingAverage ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setShellError(e.message || "Failed to load profile");
          setDriverName("Driver");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <DriverProfileContext.Provider value={{ driverName, isOnline, ratingAverage }}>
      <DriverShell
        driverName={driverName}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        availabilityLoading={profileLoading}
      >
        {shellError ? <div className="dd-alert-error">{shellError}</div> : null}
        {children}
      </DriverShell>
    </DriverProfileContext.Provider>
  );
}

export default DriverLayout;
