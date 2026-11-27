export const optionalNotificationCategories = [
  "subscriptions",
  "budget",
  "savings",
] as const;
type OptionalCategory = (typeof optionalNotificationCategories)[number];

function isOptionalCategory(value: unknown): value is OptionalCategory {
  return optionalNotificationCategories.some((category) => category === value);
}

export function parseFinancePreferences(
  serialized: string,
): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(serialized);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function mutedNotificationCategories(serialized: string) {
  const value = parseFinancePreferences(serialized).mutedNotifications;
  return Array.isArray(value) ? value.filter(isOptionalCategory) : [];
}
