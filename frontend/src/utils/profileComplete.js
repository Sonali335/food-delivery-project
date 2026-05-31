const SETUP_BY_ROLE = {
  customer: "/setup/customer",
  driver: "/setup/driver",
  restaurant: "/setup/restaurant",
};

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isCustomerProfileComplete(profile) {
  if (!profile) return false;
  const addr = profile.addresses?.[0];
  return (
    hasText(profile.username) &&
    hasText(profile.phone) &&
    hasText(addr?.street) &&
    hasText(addr?.city) &&
    hasText(addr?.state) &&
    hasText(addr?.postalCode)
  );
}

export function isDriverProfileComplete(profile) {
  if (!profile) return false;
  return (
    hasText(profile.username) &&
    hasText(profile.phone) &&
    hasText(profile.vehicleType) &&
    hasText(profile.vehicleNumber) &&
    hasText(profile.licenseNumber)
  );
}

export function isRestaurantProfileComplete(profile) {
  if (!profile) return false;
  return (
    hasText(profile.restaurantName) &&
    hasText(profile.phone) &&
    hasText(profile.location)
  );
}

export function isProfileComplete(profile, role) {
  if (role === "customer") return isCustomerProfileComplete(profile);
  if (role === "driver") return isDriverProfileComplete(profile);
  if (role === "restaurant") return isRestaurantProfileComplete(profile);
  return false;
}

export function getSetupPathForRole(role) {
  return SETUP_BY_ROLE[role] || "/setup/customer";
}
