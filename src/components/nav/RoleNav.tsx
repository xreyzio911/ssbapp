"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  match?: "exact" | "prefix";
};

function hasExactMatch(pathname: string, items: NavItem[]) {
  return items.some((item) => (item.match ?? "exact") === "exact" && pathname === item.href);
}

function isItemActive(pathname: string, item: NavItem, exactMatchExists: boolean) {
  const mode = item.match ?? "exact";
  if (mode === "prefix") {
    if (exactMatchExists && pathname !== item.href) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
}

export function RoleNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const exactMatchExists = hasExactMatch(pathname, items);

  return (
    <nav aria-label="Navigasi" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = isItemActive(pathname, item, exactMatchExists);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring-focus)]",
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
