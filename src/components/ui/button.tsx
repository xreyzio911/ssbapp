import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  loadingText?: string;
  loadingIcon?: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  isLoading = false,
  loadingText,
  loadingIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring-focus)]",
        "disabled:opacity-55 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-inherit",
        variant === "primary" &&
          "bg-[#1E453E] text-white shadow-sm hover:bg-[#173730]",
        variant === "secondary" &&
          "bg-[#D4AF37] text-[#1E453E] shadow-sm hover:bg-[#c9a534]",
        variant === "ghost" &&
          "bg-transparent text-[#1E453E] hover:bg-[#1E453E]/10",
        className
      )}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          {loadingIcon ? loadingIcon : <span className="h-3 w-3 animate-pulse rounded-full bg-current/80" />}
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
