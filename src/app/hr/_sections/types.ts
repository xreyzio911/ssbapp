export type HrEmployee = {
  id: string;
  name: string;
  email: string | null;
  username: string;
  position?: string | null;
  workLocation?: string | null;
};

export type HrAuditLog = {
  id: string;
  action: string;
  createdAt: string;
  actorName: string | null;
};
