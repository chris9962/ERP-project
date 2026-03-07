"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Tim kiem..."
          className="h-9 w-full border-neutral-200 bg-neutral-50 pl-9 text-sm focus-visible:ring-1"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-neutral-500">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-neutral-900 text-xs font-medium text-white">
              AD
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-neutral-700">Admin</span>
        </div>
      </div>
    </header>
  );
}
