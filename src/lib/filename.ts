import { formatJakartaTimestamp } from "./time";

function normalizeText(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function sanitizeEmployeeName(name: string) {
  return normalizeText(name).replace(/\s+/g, "");
}

export function sanitizeTitle(title: string) {
  return normalizeText(title).replace(/\s+/g, "-");
}

export function buildEmployeeStoredFilename(
  employeeName: string,
  docType: string,
  extension: string,
  date = new Date()
) {
  const safeName = sanitizeEmployeeName(employeeName);
  const ts = formatJakartaTimestamp(date);
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${safeName}-${docType}-${ts}${ext}`;
}

export function buildHrStoredFilename(
  title: string,
  extension: string,
  date = new Date()
) {
  const safeTitle = sanitizeTitle(title);
  const ts = formatJakartaTimestamp(date);
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `HR-${safeTitle}-${ts}${ext}`;
}
