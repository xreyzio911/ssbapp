import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/enums";
import { HrTabsContent } from "./HrTabsContent";

export default async function HrDashboard() {
  await requireRole(UserRole.HR);

  const [employees, logs] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: true },
    }),
  ]);

  const safeLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt.toISOString(),
    actorName: log.actor?.name ?? null,
  }));

  return <HrTabsContent employees={employees} logs={safeLogs} />;
}

