import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Calculate full-time salary breakdown for a given month.
 *
 * Rules:
 * - daily_rate = salary_amount / days_in_month
 * - 4 paid days off per month (nghỉ có lương)
 * - 1 leave day earned per month (12/year), accumulates if unused
 * - Only attendance value=0 counts as absent; no attendance record = worked
 * - No overtime (1.5) or half-day (0.5) for full-time
 *
 * @param elapsedDays - number of days to calculate for (for real-time: days so far; for finalize: full month)
 */
function calcFullTimeSalary(
  salaryAmount: number,
  daysInMonth: number,
  absentDays: number,
  leaveRemaining: number,
  elapsedDays: number,
) {
  const dailyRate = salaryAmount / daysInMonth;
  const paidOffDays = Math.min(absentDays, 4);
  const absentAfterPaidOff = Math.max(0, absentDays - 4);
  const leaveDaysUsed = Math.min(absentAfterPaidOff, leaveRemaining);
  const unpaidDays = Math.max(0, absentAfterPaidOff - leaveDaysUsed);
  const totalSalary = dailyRate * elapsedDays - unpaidDays * dailyRate;

  return { dailyRate, paidOffDays, leaveDaysUsed, unpaidDays, totalSalary };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") ?? "");
  const year = parseInt(searchParams.get("year") ?? "");

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  const supabase = await createClient();

  // Check if this period is finalized
  const { data: period } = await supabase
    .from("salary_periods")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .single();

  const finalized = period?.status === "finalized";

  if (finalized) {
    // Query from salary_records
    const { data: records } = await supabase
      .from("salary_records")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    const rows = (records ?? []).map((r) => ({
      employee_id: r.employee_id,
      employee_code: r.employee_code || "",
      full_name: r.full_name || "",
      employment_type: r.employment_type || "full_time",
      salary_amount: Number(r.salary_amount) || 0,
      total_days: Number(r.total_days) || 0,
      bonus: Number(r.bonus) || 0,
      total_salary: Number(r.total_salary) || 0,
      note: r.note || "",
      absent_days: Number(r.absent_days) || 0,
      paid_off_days: Number(r.paid_off_days) || 0,
      leave_days_used: Number(r.leave_days_used) || 0,
      unpaid_days: Number(r.unpaid_days) || 0,
    }));

    return NextResponse.json({ finalized: true, rows });
  }

  // Real-time query
  const lastDay = new Date(year, month, 0).getDate();
  const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, full_name, department, employment_type, salary_amount")
    .eq("status", "active")
    .lte("start_date", toDate);

  if (!employees?.length) return NextResponse.json({ finalized: false, rows: [] });

  // Get leave balances for full-time employees
  const fullTimeIds = employees.filter((e) => e.employment_type === "full_time").map((e) => e.id);
  let leaveMap = new Map<string, number>();

  if (fullTimeIds.length > 0) {
    const { data: balances } = await supabase
      .from("employee_leave_balances")
      .select("employee_id, remaining_days")
      .eq("year", year)
      .in("employee_id", fullTimeIds);

    for (const b of balances ?? []) {
      leaveMap.set(b.employee_id, Number(b.remaining_days) || 0);
    }
  }

  // For real-time: calculate up to today or end of month (whichever is earlier)
  const today = new Date();
  const isCurrentOrFuture = year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1);
  const elapsedDays = (year === today.getFullYear() && month === today.getMonth() + 1)
    ? today.getDate() // current month: days so far
    : (isCurrentOrFuture ? 0 : lastDay); // past month: full month; future: 0

  const rows = [];

  for (const emp of employees) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("value")
      .eq("employee_id", emp.id)
      .gte("date", fromDate)
      .lte("date", toDate);

    const salaryAmount = Number(emp.salary_amount) || 0;
    const isFullTime = emp.employment_type === "full_time";

    if (isFullTime) {
      // Full-time: count only value=0 as absent
      const absentDays = attendance?.filter((a) => Number(a.value) === 0).length || 0;
      // Available leave = previous remaining + 1 (this month's earned leave)
      const previousRemaining = leaveMap.get(emp.id) ?? 0;
      const availableLeave = previousRemaining + 1;

      const calc = calcFullTimeSalary(salaryAmount, lastDay, absentDays, availableLeave, elapsedDays);

      rows.push({
        employee_id: emp.id,
        employee_code: emp.employee_code || "",
        full_name: emp.full_name || "",
        employment_type: emp.employment_type || "full_time",
        salary_amount: salaryAmount,
        total_days: elapsedDays - absentDays,
        bonus: 0,
        total_salary: calc.totalSalary,
        note: "",
        absent_days: absentDays,
        paid_off_days: calc.paidOffDays,
        leave_days_used: calc.leaveDaysUsed,
        unpaid_days: calc.unpaidDays,
      });
    } else {
      // Part-time: same as before
      const totalDays = attendance?.reduce((sum: number, a: { value: number }) => sum + Number(a.value), 0) || 0;
      const totalSalary = salaryAmount * totalDays;

      rows.push({
        employee_id: emp.id,
        employee_code: emp.employee_code || "",
        full_name: emp.full_name || "",
        employment_type: emp.employment_type || "full_time",
        salary_amount: salaryAmount,
        total_days: totalDays,
        bonus: 0,
        total_salary: totalSalary,
        note: "",
        absent_days: 0,
        paid_off_days: 0,
        leave_days_used: 0,
        unpaid_days: 0,
      });
    }
  }

  return NextResponse.json({ finalized: false, rows });
}
