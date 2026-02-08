import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type InlineNoticeProps = HTMLAttributes<HTMLParagraphElement> & {
  tone: "success" | "error" | "info";
  message: string;
};

export function InlineNotice({ tone, message, className, ...props }: InlineNoticeProps) {
  const isError = tone === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "rounded-xl border px-3 py-2 text-xs",
        tone === "success" && "border-[#1E453E]/20 bg-[#1E453E]/10 text-[#1E453E]",
        tone === "error" && "border-red-200 bg-[#fde8e8] text-[#9f1d1d]",
        tone === "info" && "border-[#D4AF37]/40 bg-[#fff7e1] text-[#1E453E]",
        className
      )}
      {...props}
    >
      {message}
    </p>
  );
}

