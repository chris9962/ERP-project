import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  // Only show manager, owner, admin roles in user management
  const ADMIN_ROLES = ["manager", "owner", "admin", "office_staff"];
  const { data: roles } = await supabase.from("roles").select("*").order("name");
  const rolesMap = new Map((roles ?? []).map((r) => [r.id, r]));
  const adminRoleIds = (roles ?? [])
    .filter((r) => ADMIN_ROLES.includes(r.name))
    .map((r) => r.id);

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("*")
    .in("role_id", adminRoleIds)
    .order("created_at", { ascending: false });
  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  if (!profiles?.length) return NextResponse.json(profiles ?? []);

  // Check which profiles have linked employees
  const profileIds = profiles.map((p) => p.id);
  const { data: employees } = await supabase
    .from("employees")
    .select("id, profile_id")
    .in("profile_id", profileIds);
  const employeeMap = new Map(
    (employees ?? []).map((e) => [e.profile_id, e.id]),
  );

  const list = profiles.map((p) => ({
    ...p,
    roles: p.role_id
      ? { name: rolesMap.get(p.role_id)?.name ?? null, label: rolesMap.get(p.role_id)?.label ?? null }
      : null,
    employee_id: employeeMap.get(p.id) ?? null,
  }));
  return NextResponse.json(list);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { userId, action, full_name, phone, role_id, is_active } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (action === "toggleActive" && typeof is_active === "boolean") {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active })
      .eq("id", userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const updates: { full_name?: string; phone?: string; role_id?: string | null } = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (role_id !== undefined) updates.role_id = role_id || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
