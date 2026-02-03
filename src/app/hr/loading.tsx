import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-[#1E453E]/10" />
          <div className="h-3 w-64 rounded bg-[#1E453E]/10" />
          <div className="h-10 w-full rounded-2xl bg-[#1E453E]/5" />
          <div className="h-10 w-full rounded-2xl bg-[#1E453E]/5" />
        </div>
      </Card>
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-36 rounded bg-[#1E453E]/10" />
          <div className="h-3 w-56 rounded bg-[#1E453E]/10" />
          <div className="h-10 w-full rounded-2xl bg-[#1E453E]/5" />
        </div>
      </Card>
    </div>
  );
}
