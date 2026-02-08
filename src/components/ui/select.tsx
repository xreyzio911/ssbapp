import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export function Select({ className, invalid = false, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border bg-white px-4 py-2 text-sm text-[#1B1B1B] shadow-sm transition",
        "focus:outline-none focus:ring-2 focus:ring-[#1E453E]/20",
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
          : "border-[#1E453E]/15 focus:border-[#1E453E]",
        className
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

