"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck, BarChart3, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

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

type DailyStat = {
  date: string;
  marked: number;
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
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [chartTotal, setChartTotal] = useState(0);
  const [chartLoading, setChartLoading] = useState(true);
  const [todaySalary, setTodaySalary] = useState(0);
  const [salaryLoading, setSalaryLoading] = useState(true);

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

  const fetchDailyStats = useCallback(async () => {
    setChartLoading(true);
    const res = await fetch("/api/attendance/daily-stats", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setDailyStats(data.stats ?? []);
      setChartTotal(data.totalEmployees ?? 0);
    }
    setChartLoading(false);
  }, []);

  const fetchTodaySalary = useCallback(async () => {
    setSalaryLoading(true);
    const res = await fetch("/api/dashboard/today-salary", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setTodaySalary(data.totalSalary ?? 0);
    }
    setSalaryLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDailyStats();
    fetchTodaySalary();
  }, [fetchStats, fetchDailyStats, fetchTodaySalary]);

  const lines = [
    { count: counts.fullDay, label: "người làm đủ ngày(1)" },
    { count: counts.halfDay, label: "người làm nửa ngày(0.5)" },
    { count: counts.overtime, label: "người tăng ca(1.5)" },
    { count: counts.absent, label: "người vắng" },
  ].filter((l) => l.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Link
          href={`/reports/attendance?from=${getTodayISO()}&to=${getTodayISO()}`}
          className="block transition-opacity hover:opacity-90"
        >
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
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

        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Lương phải chi hôm nay</CardTitle>
            <Banknote className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            {salaryLoading ? (
              <div className="text-neutral-400">—</div>
            ) : (
              <div className="text-2xl font-bold text-primary">
                {todaySalary.toLocaleString("vi-VN")}
                <span className="ml-1 text-sm font-normal text-neutral-500">VND</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar chart: Điểm danh theo ngày */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-neutral-500">
            Điểm danh tháng {new Date().getMonth() + 1}
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-neutral-400" />
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="flex h-[300px] items-center justify-center text-neutral-400">Đang tải...</div>
          ) : dailyStats.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-neutral-400">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats.map((d) => ({ ...d, label: formatDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, chartTotal || "auto"]} />
                <Tooltip
                  labelFormatter={(label) => `Ngày ${label}`}
                  formatter={(value) => [`${value}/${chartTotal}`, "Đã điểm danh"]}
                />
                <Bar dataKey="marked" radius={[3, 3, 0, 0]}>
                  {dailyStats.map((d, i) => (
                    <Cell key={i} fill={d.marked >= chartTotal ? "#22c55e" : d.marked > 0 ? "#3b82f6" : "#e5e7eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
