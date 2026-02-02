import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-[#1E453E]/15 bg-white px-4 py-2 text-sm text-[#1B1B1B] shadow-sm",
        "placeholder:text-[#7a7a7a] focus:border-[#1E453E] focus:outline-none focus:ring-2 focus:ring-[#1E453E]/15",
        className
      )}
      {...props}
    />
  );
}
