"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: string;
};

type TabsContextValue = {
  items: TabItem[];
  activeId: string;
  setActiveId: (id: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function RoleTabsProvider({
  items,
  defaultId,
  children,
}: {
  items: TabItem[];
  defaultId: string;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState(defaultId);

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && items.some((item) => item.id === hash)) {
        setActiveId(hash);
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => {
      window.removeEventListener("hashchange", applyHash);
    };
  }, [items]);

  const value = useMemo(
    () => ({ items, activeId, setActiveId }),
    [items, activeId]
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useRoleTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("RoleTabsProvider is missing.");
  }
  return ctx;
}

export function RoleTabsNav() {
  const { items, activeId, setActiveId } = useRoleTabs();

  return (
    <nav className="inline-flex flex-wrap gap-2 rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_10px_30px_rgba(30,69,62,0.12)]">
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveId(item.id);
              window.history.replaceState(null, "", `#${item.id}`);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-[#1E453E] text-white shadow-[0_6px_18px_rgba(30,69,62,0.25)]"
                : "bg-transparent text-[#1E453E] hover:bg-[#1E453E]/10"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
