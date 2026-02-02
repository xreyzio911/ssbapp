import { UserRole } from "@/lib/enums";

type SessionUser = { role: UserRole } | null;

export function hasRole(user: SessionUser, role: UserRole) {
  return !!user && user.role === role;
}

