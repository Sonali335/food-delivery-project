import { getRestaurantSettings } from "../api/restaurant";
import { updateOrder, updateOrderStatus } from "../api/orders";
import { calculateETA } from "./calculateETA";
import {
  DEFAULT_PREP_TIME,
  maxPrepTimeFromItems,
  normalizePrepTime,
} from "./prepTime";

export async function acceptRestaurantOrder(orderId, orderItems = []) {
  let prepTime = maxPrepTimeFromItems(orderItems);
  if (!prepTime) {
    try {
      const { settings } = await getRestaurantSettings();
      prepTime = settings?.prepTime
        ? normalizePrepTime(settings.prepTime)
        : DEFAULT_PREP_TIME;
    } catch {
      prepTime = DEFAULT_PREP_TIME;
    }
  }

  const eta = calculateETA(prepTime);
  const { order: accepted } = await updateOrderStatus(orderId, "ACCEPTED");
  const { order: withEta } = await updateOrder(orderId, {
    eta,
    prepTimeMinutes: prepTime,
  });
  return {
    order: {
      ...accepted,
      ...withEta,
      eta: withEta.eta || eta,
      prepTimeMinutes: withEta.prepTimeMinutes ?? prepTime,
    },
  };
}
