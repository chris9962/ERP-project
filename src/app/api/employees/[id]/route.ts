import { createClient } from "@/lib/supabase/server";
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
  const { full_name, employee_code, cccd_number, dob, address, gender, department, employment_type, status, salary_amount, avatar_url, role_id } = body;
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
