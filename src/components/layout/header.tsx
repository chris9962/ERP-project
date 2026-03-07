"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Menu } from "lucide-react";

type HeaderProps = {
  onOpenMobileMenuAction?: () => void;
};

export function Header({ onOpenMobileMenuAction }: HeaderProps) {
  const { profile, roleName } = useAuth();

  async function handleSignOut() {
    try {
      await fetch("/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  }

  const initials = profile?.full_name
    ? profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
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
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src="/logo/logo.jpeg"
              alt="LegoFood"
              fill
              className="object-cover"
              sizes="32px"
              priority
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-neutral-900">
            LegoFood
          </span>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-neutral-900 text-xs font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="text-sm font-medium text-neutral-700">
              {profile?.full_name || profile?.email || "User"}
            </span>
            <p className="text-xs text-neutral-400">{roleName}</p>
          </div>
        </div>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-neutral-500"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
