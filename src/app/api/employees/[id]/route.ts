import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, profiles(full_name, email)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { full_name, employee_code, cccd_number, dob, address, gender, department, employment_type, status, salary_amount, avatar_url, role_id, contract_extra_data, start_date } = body;
  const { data, error } = await supabase
    .from("employees")
    .update({
      ...(full_name !== undefined && { full_name }),
      ...(employee_code !== undefined && { employee_code: employee_code || null }),
      ...(cccd_number !== undefined && { cccd_number: cccd_number || null }),
      ...(dob !== undefined && { dob: dob || null }),
      ...(address !== undefined && { address: address || null }),
      ...(gender !== undefined && { gender: gender || null }),
      ...(department !== undefined && { department: department || null }),
      ...(employment_type !== undefined && { employment_type }),
      ...(status !== undefined && { status }),
      ...(salary_amount !== undefined && { salary_amount: parseFloat(salary_amount) || 0 }),
      ...(avatar_url !== undefined && { avatar_url: avatar_url || null }),
      ...(contract_extra_data !== undefined && { contract_extra_data }),
      ...(start_date !== undefined && { start_date: start_date || null }),
    })
    .eq("id", id)
    .select("profile_id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update role_id in profiles table
  if (role_id !== undefined && data?.profile_id) {
    await supabase
      .from("profiles")
      .update({ role_id: role_id || null })
      .eq("id", data.profile_id);
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify caller is admin/owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = (profile?.roles as unknown as { name: string } | null)?.name;
  if (roleName !== "admin" && roleName !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get employee's profile_id before deleting
  const { data: emp } = await supabase
    .from("employees")
    .select("profile_id")
    .eq("id", id)
    .single();

  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Prevent self-delete
  if (emp.profile_id === user.id) {
    return NextResponse.json({ error: "Không thể xóa chính mình" }, { status: 400 });
  }

  // Delete employee (cascades: attendance, employee_leave_balances)
  // salary_records are kept (no FK cascade)
  const { error: delErr } = await supabase.from("employees").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Delete profile
  await supabase.from("profiles").delete().eq("id", emp.profile_id);

  // Delete auth user (requires service role key)
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(emp.profile_id);

  return NextResponse.json({ success: true });
}
