/** Default post-login route for each role. */
export function getHomePathForRole(role) {
  if (role === "restaurant") return "/restaurant/dashboard";
  if (role === "driver") return "/driver/dashboard";
  if (role === "customer") return "/customer/dashboard";
  return "/dashboard";
}
