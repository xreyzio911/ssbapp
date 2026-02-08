import { requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/enums";
import { HrReportsSection } from "../_sections/HrReportsSection";

export default async function ReportsPage() {
  await requireRole(UserRole.HR);
  return <HrReportsSection />;
}

