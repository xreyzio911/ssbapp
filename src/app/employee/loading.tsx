import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-44 rounded bg-[#1E453E]/10" />
          <div className="h-3 w-72 rounded bg-[#1E453E]/10" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-14 rounded-2xl bg-[#1E453E]/5" />
            <div className="h-14 rounded-2xl bg-[#1E453E]/5" />
            <div className="h-14 rounded-2xl bg-[#1E453E]/5" />
            <div className="h-14 rounded-2xl bg-[#1E453E]/5" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-36 rounded bg-[#1E453E]/10" />
          <div className="h-10 w-40 rounded-2xl bg-[#1E453E]/5" />
        </div>
      </Card>
    </div>
  );
}
