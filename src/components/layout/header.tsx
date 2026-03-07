"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";

export function Header() {
  const { profile, roleName, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
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
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div />

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
