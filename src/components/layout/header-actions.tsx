"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function usePortalTarget(id: string) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById(id));
  }, [id]);
  return target;
}

export function HeaderActions({ children }: { children: React.ReactNode }) {
  const target = usePortalTarget("header-actions");
  if (!target) return null;
  return createPortal(children, target);
}

export function HeaderBack({ href }: { href: string }) {
  const target = usePortalTarget("header-back");
  if (!target) return null;
  return createPortal(
    <Link href={href}>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </Link>,
    target,
  );
}
