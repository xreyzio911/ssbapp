export const UserRole = {
  HR: "HR",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DocType = {
  KTP: "KTP",
  KK: "KK",
  CV: "CV",
  IJAZAH: "IJAZAH",
  TRANSKRIP: "TRANSKRIP",
  PAKLARING: "PAKLARING",
  SERTIFIKAT: "SERTIFIKAT",
  FOTO: "FOTO",
} as const;

export type DocType = (typeof DocType)[keyof typeof DocType];

export const HrFileType = {
  GENERAL: "GENERAL",
  AGREEMENT: "AGREEMENT",
} as const;

export type HrFileType = (typeof HrFileType)[keyof typeof HrFileType];

export const AssignmentStatus = {
  PENDING: "PENDING",
  SIGNED: "SIGNED",
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];
