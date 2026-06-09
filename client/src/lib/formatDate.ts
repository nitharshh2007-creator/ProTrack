/**
 * Safely formats a date value.
 * Returns "Not Set" if the value is missing, null, or results in an invalid date.
 */
export const formatDate = (
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string => {
  if (!value) return "Not Set";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Not Set";
  return date.toLocaleDateString(undefined, options);
};
