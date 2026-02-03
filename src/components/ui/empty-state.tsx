import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-[#1E453E]/20 bg-white/70 p-6 text-center shadow-[0_12px_30px_rgba(30,69,62,0.08)]",
        className
      )}
      {...props}
    >
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-[#1E453E]/10" />
      <p className="text-sm font-semibold text-[#1E453E]">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-[#6c6f6e]">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
