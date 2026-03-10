const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Telegram] Send failed:", res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Telegram] Error:", err);
    return false;
  }
}

type AttendanceSummaryInput = {
  date: string;
  entries: Array<{ employeeId: string; value: number; note: string | null }>;
  employees: Array<{ id: string; full_name: string | null; department: string | null }>;
  notedByName: string;
};

const VALUE_LABELS: Record<number, string> = {
  0: "Vắng",
  0.5: "Nửa ngày",
  1: "Đủ ngày",
  1.5: "Tăng ca",
};

export function buildAttendanceSummary(input: AttendanceSummaryInput): string {
  const { date, entries, employees, notedByName } = input;
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const countByValue: Record<number, number> = { 0: 0, 0.5: 0, 1: 0, 1.5: 0 };
  for (const entry of entries) {
    if (entry.value in countByValue) {
      countByValue[entry.value]++;
    }
  }

  const absentList = entries
    .filter((e) => e.value === 0)
    .map((e) => {
      const emp = empMap.get(e.employeeId);
      return emp?.full_name || e.employeeId;
    });

  const halfDayList = entries
    .filter((e) => e.value === 0.5)
    .map((e) => {
      const emp = empMap.get(e.employeeId);
      return emp?.full_name || e.employeeId;
    });

  const unmarkedEmployees = employees.filter(
    (emp) => !entries.some((e) => e.employeeId === emp.id),
  );

  const lines: string[] = [
    `📋 <b>BÁO CÁO ĐIỂM DANH</b>`,
    `📅 Ngày: <b>${date}</b>`,
    `👤 Người điểm danh: ${notedByName}`,
    ``,
    `📊 <b>Tổng hợp:</b>`,
    `  • Tổng điểm danh: <b>${entries.length}</b> / ${employees.length} nhân viên`,
  ];

  for (const [val, label] of Object.entries(VALUE_LABELS)) {
    const count = countByValue[Number(val)];
    if (count > 0) {
      lines.push(`  • ${label}: <b>${count}</b>`);
    }
  }

  if (unmarkedEmployees.length > 0) {
    lines.push(`  • Chưa điểm danh: <b>${unmarkedEmployees.length}</b>`);
  }

  if (absentList.length > 0) {
    lines.push(``);
    lines.push(`🚫 <b>Danh sách vắng (${absentList.length}):</b>`);
    absentList.forEach((name) => lines.push(`  - ${name}`));
  }

  if (halfDayList.length > 0) {
    lines.push(``);
    lines.push(`⏰ <b>Nửa ngày (${halfDayList.length}):</b>`);
    halfDayList.forEach((name) => lines.push(`  - ${name}`));
  }

  if (unmarkedEmployees.length > 0) {
    lines.push(``);
    lines.push(`❓ <b>Chưa điểm danh (${unmarkedEmployees.length}):</b>`);
    unmarkedEmployees.forEach((emp) => lines.push(`  - ${emp.full_name || emp.id}`));
  }

  return lines.join("\n");
}
