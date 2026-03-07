"use client";

import { useAuth } from "@/lib/auth-context";
import LoadingBars from "@/components/ui/loading-bars";

export function AuthLoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBars message="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
