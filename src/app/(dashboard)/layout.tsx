import { AuthLoadingGate } from "@/components/auth-loading-gate";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLoadingGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthLoadingGate>
  );
}
