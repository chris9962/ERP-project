import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Từ ngày 1 tháng này đến hôm nay (dùng local date tránh lệch UTC)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d2 = String(now.getDate()).padStart(2, "0");
  const from = `${y}-${m}-01`;
  const to = `${y}-${m}-${d2}`;

  // Đếm tổng nhân viên active
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { data: records, error } = await supabase
    .from("attendance")
    .select("date, value")
    .gte("date", from)
    .lte("date", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by date: đếm số người đã điểm danh (value != null)
  const byDate: Record<string, number> = {};
  for (const r of records ?? []) {
    byDate[r.date] = (byDate[r.date] || 0) + 1;
  }

  // Build dates from 1st to today
  const dates: string[] = [];
  for (let day = 1; day <= now.getDate(); day++) {
    dates.push(`${y}-${m}-${String(day).padStart(2, "0")}`);
  }

  const stats = dates.map((date) => ({
    date,
    marked: byDate[date] || 0,
  }));

  return NextResponse.json({ stats, totalEmployees: totalEmployees ?? 0 });
}
