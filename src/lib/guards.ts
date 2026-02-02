import { UserRole } from "@/lib/enums";

export function hasRole<T extends { role: UserRole }>(
  user: T | null,
  role: UserRole
): user is T {
  return !!user && user.role === role;
}

