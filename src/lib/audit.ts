import { prisma } from "./db";
import { UserRole } from "@prisma/client";

type AuditInput = {
  actorId?: string;
  actorRole?: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? {},
    },
  });
}
