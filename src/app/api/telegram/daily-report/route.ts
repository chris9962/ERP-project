import { NextResponse } from "next/server";
import { getDashboardStats, buildDailyReport } from "@/lib/dashboard-stats";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    const message = buildDailyReport(stats);
    const sent = await sendTelegramMessage(message);

    return NextResponse.json({ ok: sent, message });
  } catch (err) {
    console.error("[Daily Report]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
