import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { employer_name, employer_title, employer_address, employer_phone, employer_tax_code, contract_location } = body;

  // Get the single row id
  const { data: existing, error: fetchError } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Không tìm thấy cài đặt công ty" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("company_settings")
    .update({
      employer_name: employer_name ?? "",
      employer_title: employer_title ?? "",
      employer_address: employer_address ?? "",
      employer_phone: employer_phone ?? "",
      employer_tax_code: employer_tax_code ?? "",
      contract_location: contract_location ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
