import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/dashboard-stats";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ totalSalary: stats.todaySalary });
  } catch (err) {
    console.error("[Today Salary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
