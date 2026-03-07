"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { getPageTitleForPath } from "@/lib/navigation";

type HeaderProps = {
  onOpenMobileMenuAction?: () => void;
};

export function Header({ onOpenMobileMenuAction }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitleForPath(pathname ?? "");

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-neutral-600 md:hidden"
          onClick={onOpenMobileMenuAction}
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="truncate text-base font-semibold text-neutral-900">
          {pageTitle}
        </span>
      </div>
    </header>
  );
}
