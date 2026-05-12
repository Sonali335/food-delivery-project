/**
 * @param {unknown} password
 * @returns {string|null} Human-readable error, or null if valid.
 */
export function getPasswordPolicyMessage(password) {
  const p = String(password ?? "");
  if (p.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/\d/.test(p)) {
    return "Password must contain at least one number";
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    return "Password must contain at least one symbol (e.g. !@#$%)";
  }
  return null;
}
