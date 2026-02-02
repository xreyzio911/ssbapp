import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "yellow" | "gray" | "red";
};

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "green" && "bg-[#1E453E]/10 text-[#1E453E]",
        tone === "yellow" && "bg-[#D4AF37]/20 text-[#8a6a00]",
        tone === "gray" && "bg-[#e9e9e9] text-[#555]",
        tone === "red" && "bg-[#f9d6d6] text-[#a42828]",
        className
      )}
      {...props}
    />
  );
}
