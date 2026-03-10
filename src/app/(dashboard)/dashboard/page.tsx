"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

type AttendanceCounts = {
  fullDay: number;
  halfDay: number;
  overtime: number;
  absent: number;
  notMarked: number;
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<AttendanceCounts>({
    fullDay: 0,
    halfDay: 0,
    overtime: 0,
    absent: 0,
    notMarked: 0,
  });
  const [totalEmployees, setTotalEmployees] = useState(0);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const today = getTodayISO();
    const attRes = await fetch(`/api/attendance?date=${today}`, { credentials: "include" });
    if (attRes.ok) {
      const attData = (await attRes.json()) as {
        employees?: unknown[];
        entries?: Record<string, { value: number | null }>;
      };
      const empList = attData.employees ?? [];
      const entries = attData.entries ?? {};
      setTotalEmployees(empList.length);

      const values = Object.values(entries).map((e) => e.value);
      setCounts({
        fullDay: values.filter((v) => v === 1).length,
        halfDay: values.filter((v) => v === 0.5).length,
        overtime: values.filter((v) => v === 1.5).length,
        absent: values.filter((v) => v === 0).length,
        notMarked: values.filter((v) => v == null).length,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const lines = [
    { count: counts.fullDay, label: "người làm đủ ngày(1)" },
    { count: counts.halfDay, label: "người làm nửa ngày(0.5)" },
    { count: counts.overtime, label: "người tăng ca(1.5)" },
    { count: counts.absent, label: "người vắng" },
  ].filter((l) => l.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/reports/attendance?from=${getTodayISO()}&to=${getTodayISO()}`}
          className="block transition-opacity hover:opacity-90"
        >
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">Điểm danh hôm nay</CardTitle>
              <CalendarCheck className="h-4 w-4 text-neutral-400" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {totalEmployees - counts.notMarked}
                    </span>
                    <span className="text-lg text-neutral-400">/ {totalEmployees}</span>
                    <span className="ml-1 text-sm text-neutral-500">đã điểm danh</span>
                  </div>
                  {lines.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                      {lines.map(({ count, label }) => (
                        <span key={label}>
                          <span className="font-semibold text-neutral-700">{count}</span> {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
