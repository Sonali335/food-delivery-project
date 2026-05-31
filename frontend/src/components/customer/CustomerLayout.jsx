import { useEffect, useState } from "react";
import { getProfile } from "../../api/profile";
import CustomerShell from "./CustomerShell";

function CustomerLayout({ children }) {
  const [customerName, setCustomerName] = useState("Customer");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(({ profile }) => {
        if (!cancelled && profile?.username) {
          setCustomerName(profile.username.trim());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return <CustomerShell customerName={customerName}>{children}</CustomerShell>;
}

export default CustomerLayout;
