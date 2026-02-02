import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[#1E453E]/10 bg-white/90 p-5 shadow-[0_8px_30px_rgba(30,69,62,0.08)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
