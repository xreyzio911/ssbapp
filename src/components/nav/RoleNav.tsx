"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

export function RoleNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-[#1E453E] text-white shadow-sm"
                : "bg-white/80 text-[#1E453E] hover:bg-[#1E453E]/10"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
