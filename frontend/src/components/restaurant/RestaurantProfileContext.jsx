import { createContext, useContext } from "react";

export const RestaurantProfileContext = createContext({
  restaurantName: "",
  setRestaurantName: () => {},
  status: "open",
  setStatus: () => {},
  statusLoading: false,
  statusSaving: false,
  applyStatus: async () => {},
});

export function useRestaurantProfile() {
  return useContext(RestaurantProfileContext);
}
