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

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json(
      { error: "userId la bat buoc" },
      { status: 400 },
    );
  }

  // Prevent self-delete
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Khong the xoa chinh minh" },
      { status: 400 },
    );
  }

  // Delete employee record if exists
  await supabase.from("employees").delete().eq("profile_id", userId);

  // Delete profile
  await supabase.from("profiles").delete().eq("id", userId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);

  return NextResponse.json({ success: true });
}
