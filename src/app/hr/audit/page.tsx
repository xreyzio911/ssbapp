import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { HrAuditSection } from "../_sections/HrAuditSection";

export default async function AuditPage() {
  await requireRole(UserRole.HR);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  const safeLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    actorName: log.actor?.name ?? null,
  }));

  return <HrAuditSection logs={safeLogs} />;
}
