"use client";

import { useState, useCallback } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

/* ── Hook ── */

export function useSort<K extends string>(defaultKey: K, defaultDir: "asc" | "desc" = "asc") {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultDir);

  const toggleSort = useCallback(
    (key: K) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  return { sortKey, sortDir, toggleSort } as const;
}

/* ── Component ── */

type SortableTableHeadProps<K extends string> = {
  column: K;
  sortKey: K;
  sortDir: "asc" | "desc";
  onSort: (key: K) => void;
  children: React.ReactNode;
  className?: string;
};

export function SortableTableHead<K extends string>({
  column,
  sortKey,
  sortDir,
  onSort,
  children,
  className,
}: SortableTableHeadProps<K>) {
  const active = sortKey === column;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead
      className={`cursor-pointer select-none ${className ?? ""}`}
      onClick={() => onSort(column)}
    >
      {children}
      <Icon className={`ml-1 inline h-3.5 w-3.5 ${active ? "" : "text-neutral-300"}`} />
    </TableHead>
  );
}
