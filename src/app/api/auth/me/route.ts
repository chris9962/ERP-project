import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, profile: null });
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profileData) {
    return NextResponse.json({ user, profile: null });
  }

  let roles: { name: string } | null = null;
  if (profileData.role_id) {
    const { data: roleData } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profileData.role_id)
      .single();
    if (roleData) roles = { name: roleData.name };
  }

  const profile = { ...profileData, roles };
  return NextResponse.json({ user, profile });
}
