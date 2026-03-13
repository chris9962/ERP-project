"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseAction={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 min-h-0">
        <Header onOpenMobileMenuAction={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto overflow-x-hidden bg-neutral-50 p-4 sm:p-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
