export function formatJakartaTimestamp(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const yyyy = lookup.year;
  const mm = lookup.month;
  const dd = lookup.day;
  const hh = lookup.hour;
  const min = lookup.minute;
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}
