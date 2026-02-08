export type EmployeeProfileData = {
  email: string | null;
  name: string;
  username: string;
  position?: string | null;
  workLocation?: string | null;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  nik?: string | null;
  hasSignature: boolean;
  signatureUpdatedAt?: string | null;
};

export type EmployeeDocVersion = {
  docType: string;
  createdAt: string;
};

export type EmployeeDocStatus = {
  docType: string;
  needsUpdate: boolean;
};

export type EmployeeHrAssignment = {
  id: string;
  status: "PENDING" | "SIGNED";
  assignedAt: string;
  signedAt: string | null;
  hrFile: {
    fileType: "GENERAL" | "AGREEMENT";
    title: string;
    mimeType: string;
    size: number;
  };
};
