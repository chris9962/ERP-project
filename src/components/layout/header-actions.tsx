"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function HeaderActions({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("header-actions"));
  }, []);

  if (!target) return null;

  return createPortal(children, target);
}
