import { UserRole } from "@prisma/client";

type SessionUser = { role: UserRole } | null;

export function hasRole(user: SessionUser, role: UserRole) {
  return !!user && user.role === role;
}
