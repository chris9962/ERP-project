import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { month, year, rows } = body as {
    month: number;
    year: number;
    rows: Array<{
      employee_id: string;
      employee_code: string;
      full_name: string;
      employment_type: string;
      salary_amount: number;
      total_days: number;
      bonus: number;
      total_salary: number;
      note: string;
      absent_days: number;
      paid_off_days: number;
      leave_days_used: number;
      unpaid_days: number;
    }>;
  };

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  // Get employee details for snapshot
  const employeeIds = rows.map((r) => r.employee_id);
  const { data: employees } = await supabase
    .from("employees")
    .select("id, cccd_number, employment_type, profiles(roles(name))")
    .in("id", employeeIds);

  const empMap = new Map(
    (employees ?? []).map((e) => [e.id, e]),
  );

  // Insert salary_records
  const records = rows.map((r) => {
    const emp = empMap.get(r.employee_id) as { id: string; cccd_number: string | null; profiles: { roles: { name: string } | null } | null } | undefined;
    return {
      employee_id: r.employee_id,
      month,
      year,
      full_name: r.full_name,
      employee_code: r.employee_code,
      cccd_number: emp?.cccd_number || null,
      role_name: (emp?.profiles as { roles: { name: string } | null } | null)?.roles?.name || null,
      employment_type: r.employment_type,
      salary_amount: r.salary_amount,
      total_days: r.total_days,
      bonus: r.bonus,
      total_salary: r.total_salary,
      note: r.note || null,
      absent_days: r.absent_days || 0,
      paid_off_days: r.paid_off_days || 0,
      leave_days_used: r.leave_days_used || 0,
      unpaid_days: r.unpaid_days || 0,
    };
  });

  // Delete old records if any (re-finalize case)
  await supabase
    .from("salary_records")
    .delete()
    .eq("month", month)
    .eq("year", year);

  const { error: insertErr } = await supabase
    .from("salary_records")
    .insert(records);

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Update leave balances for full-time employees
  const fullTimeRows = rows.filter((r) => {
    const emp = empMap.get(r.employee_id);
    return emp && (emp as { employment_type?: string }).employment_type === "full_time";
  });

  for (const row of fullTimeRows) {
    // Get current balance
    const { data: balance } = await supabase
      .from("employee_leave_balances")
      .select("remaining_days")
      .eq("employee_id", row.employee_id)
      .eq("year", year)
      .single();

    const previousRemaining = Number(balance?.remaining_days) || 0;
    // +1 for this month's earned leave, -leave_days_used
    const newRemaining = previousRemaining + 1 - (row.leave_days_used || 0);

    await supabase
      .from("employee_leave_balances")
      .upsert(
        {
          employee_id: row.employee_id,
          year,
          remaining_days: Math.max(0, newRemaining),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,year" },
      );
  }

  // Upsert salary_period
  const { error: periodErr } = await supabase
    .from("salary_periods")
    .upsert(
      {
        month,
        year,
        status: "finalized",
        finalized_by: user?.id ?? null,
        finalized_at: new Date().toISOString(),
      },
      { onConflict: "month,year" },
    );

  if (periodErr) return NextResponse.json({ error: periodErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { month, year } = body as { month: number; year: number };

  if (!month || !year) return NextResponse.json({ error: "month and year required" }, { status: 400 });

  // Before deleting, reverse the leave balance changes
  const { data: records } = await supabase
    .from("salary_records")
    .select("employee_id, employment_type, leave_days_used")
    .eq("month", month)
    .eq("year", year);

  for (const rec of records ?? []) {
    if (rec.employment_type !== "full_time") continue;

    const { data: balance } = await supabase
      .from("employee_leave_balances")
      .select("remaining_days")
      .eq("employee_id", rec.employee_id)
      .eq("year", year)
      .single();

    if (balance) {
      // Reverse: -1 (remove earned leave) + leave_days_used (restore used leave)
      const restored = Number(balance.remaining_days) - 1 + (Number(rec.leave_days_used) || 0);
      await supabase
        .from("employee_leave_balances")
        .update({
          remaining_days: Math.max(0, restored),
          updated_at: new Date().toISOString(),
        })
        .eq("employee_id", rec.employee_id)
        .eq("year", year);
    }
  }

  await supabase.from("salary_records").delete().eq("month", month).eq("year", year);
  await supabase.from("salary_periods").delete().eq("month", month).eq("year", year);

  return NextResponse.json({ ok: true });
}
