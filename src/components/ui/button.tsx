import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E453E]/40",
        variant === "primary" &&
          "bg-[#1E453E] text-white shadow-sm hover:bg-[#173730]",
        variant === "secondary" &&
          "bg-[#D4AF37] text-[#1E453E] shadow-sm hover:bg-[#c9a534]",
        variant === "ghost" &&
          "bg-transparent text-[#1E453E] hover:bg-[#1E453E]/10",
        className
      )}
      {...props}
    />
  );
}
