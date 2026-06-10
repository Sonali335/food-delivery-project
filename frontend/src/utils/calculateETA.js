/** @param {number} prepTimeMinutes */
export function calculateETA(prepTimeMinutes = 20) {
  const minutes = Number(prepTimeMinutes);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 20;
  return new Date(Date.now() + safeMinutes * 60 * 1000).toISOString();
}
