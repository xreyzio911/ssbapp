import { prisma } from "./db";
import { UserRole } from "@/lib/enums";

type AuditInput = {
  actorId?: string;
  actorRole?: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: JsonValue;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export async function logAudit(entry: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? undefined,
    },
  });
}

