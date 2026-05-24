import { createContext, useContext } from "react";

export const DriverProfileContext = createContext({
  driverName: "Driver",
  isOnline: false,
});

export function useDriverProfile() {
  return useContext(DriverProfileContext);
}
