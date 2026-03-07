import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify caller is admin
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
  if (roleName !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, phone, role_id, role_name } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email va mat khau la bat buoc" },
      { status: 400 },
    );
  }

  // Determine role_id
  let finalRoleId = role_id;
  if (!finalRoleId && role_name) {
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role_name)
      .single();
    finalRoleId = role?.id || null;
  }

  // Create user via Supabase Admin API
  const { data: adminClient } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (!adminClient.user) {
    return NextResponse.json(
      { error: "Khong the tao user" },
      { status: 500 },
    );
  }

  // Update the auto-created profile with role
  await supabase
    .from("profiles")
    .update({
      full_name: full_name || null,
      phone: phone || null,
      role_id: finalRoleId,
      email,
    })
    .eq("id", adminClient.user.id);

  return NextResponse.json({ userId: adminClient.user.id });
}
