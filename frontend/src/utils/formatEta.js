export function formatEtaLabel(eta) {
  if (!eta) return null;
  const date = new Date(eta);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
