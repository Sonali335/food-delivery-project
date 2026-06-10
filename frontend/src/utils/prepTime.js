export const PREP_TIME_OPTIONS = [10, 15, 20, 25, 30, 35, 40];
export const DEFAULT_PREP_TIME = 20;

export function normalizePrepTime(value) {
  const minutes = Number(value);
  return PREP_TIME_OPTIONS.includes(minutes) ? minutes : DEFAULT_PREP_TIME;
}

export function maxPrepTimeFromItems(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const times = items.map((item) => normalizePrepTime(item.prepTime));
  return Math.max(...times);
}

export function formatPrepTimeLabel(minutes) {
  const value = normalizePrepTime(minutes);
  return `${value} min`;
}
