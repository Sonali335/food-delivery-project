import { useEffect, useState } from "react";
import { getProfile } from "../../api/profile";
import CustomerShell from "./CustomerShell";

function CustomerLayout({ children }) {
  const [customerName, setCustomerName] = useState("Customer");

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile: p }) => {
        if (cancelled || !p) return;
        if (p.username) setCustomerName(p.username.trim());
        setProfile(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CustomerShell customerName={customerName} customerProfile={profile}>
      {children}
    </CustomerShell>
  );
}

export default CustomerLayout;
