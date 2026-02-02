export const DOC_TYPES = [
  { type: "KTP", label: "KTP" },
  { type: "KK", label: "KK" },
  { type: "CV", label: "CV" },
  { type: "IJAZAH", label: "Ijazah" },
  { type: "TRANSKRIP", label: "Transkrip Nilai Terakhir" },
  { type: "PAKLARING", label: "Paklaring" },
  { type: "SERTIFIKAT", label: "Sertifikat-sertifikat" },
  { type: "FOTO", label: "Foto resmi berwarna" },
] as const;

export const DOC_TYPE_LABELS = DOC_TYPES.reduce((acc, item) => {
  acc[item.type] = item.label;
  return acc;
}, {} as Record<string, string>);
