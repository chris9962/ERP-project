import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const TEMPLATE_MAP: Record<string, string> = {
  labor: "hop-dong-lao-dong.docx",
  task: "hop-dong-khoan-viec.docx",
};

function formatCurrencyVN(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function numberToVietnameseWords(n: number): string {
  if (n === 0) return "không đồng";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const groups = ["", "nghìn", "triệu", "tỷ"];

  function readThreeDigits(num: number, showZeroHundred: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    let result = "";

    if (h > 0 || showZeroHundred) {
      result += units[h] + " trăm ";
    }
    if (t > 1) {
      result += units[t] + " mươi ";
      if (u === 1) result += "mốt ";
      else if (u === 5) result += "lăm ";
      else if (u > 0) result += units[u] + " ";
    } else if (t === 1) {
      result += "mười ";
      if (u === 5) result += "lăm ";
      else if (u > 0) result += units[u] + " ";
    } else if (t === 0 && u > 0) {
      if (h > 0 || showZeroHundred) result += "lẻ ";
      result += units[u] + " ";
    }
    return result.trim();
  }

  const parts: string[] = [];
  let remaining = Math.floor(n);
  let groupIndex = 0;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const text = readThreeDigits(chunk, groupIndex > 0 && parts.length > 0);
      parts.unshift(text + (groups[groupIndex] ? " " + groups[groupIndex] : ""));
    }
    remaining = Math.floor(remaining / 1000);
    groupIndex++;
  }

  const result = parts.join(" ").replace(/\s+/g, " ").trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      contractType,
      extraFields = {},
    } = body as {
      employeeId: string;
      contractType: "labor" | "task";
      extraFields?: Record<string, string>;
    };

    if (!employeeId || !contractType || !TEMPLATE_MAP[contractType]) {
      return NextResponse.json(
        { error: "employeeId và contractType (labor|task) là bắt buộc" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: employee, error } = await supabase
      .from("employees")
      .select("*, profiles(full_name, email)")
      .eq("id", employeeId)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Không tìm thấy nhân viên" },
        { status: 404 },
      );
    }

    const templateFile = TEMPLATE_MAP[contractType];
    const templatePath = path.join(process.cwd(), "public", "templates", templateFile);

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: `Template không tồn tại: ${templateFile}` },
        { status: 500 },
      );
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
    });

    const now = new Date();
    const birthYear = employee.dob
      ? new Date(employee.dob).getFullYear().toString()
      : "";
    const dobFormatted = employee.dob
      ? new Date(employee.dob).toLocaleDateString("vi-VN")
      : "";
    const salary = Number(employee.salary_amount) || 0;

    const templateData: Record<string, string> = {
      day: String(now.getDate()),
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      full_name: employee.full_name || "",
      birth_year: birthYear,
      dob: dobFormatted,
      nationality: "Việt Nam",
      address: employee.address || "",
      cccd_number: employee.cccd_number || "",
      department: employee.department || "",
      salary_amount: formatCurrencyVN(salary),
      salary_in_words: numberToVietnameseWords(salary),
      employee_code: employee.employee_code || "",
      contract_number: "",
      contract_location: "",
      employer_name: "",
      employer_title: "",
      employer_address: "",
      employer_phone: "",
      employer_tax_code: "",
      job_title: "",
      position: "",
      labor_book_number: "",
      responsibility_allowance: "",
      cccd_issue_place: "",
      cccd_issue_date: "",
      job_description: "",
      work_location: "",
      duration_days: "",
      start_date: "",
      end_date: "",
      ...extraFields,
    };

    // Save employee-specific extra fields back to contract_extra_data
    const employeeExtraKeys = [
      "nationality", "job_title", "position", "cccd_issue_place",
      "cccd_issue_date", "labor_book_number", "job_description",
      "work_location", "responsibility_allowance",
    ];
    const extraDataToSave: Record<string, string> = {};
    for (const key of employeeExtraKeys) {
      if (extraFields[key]) {
        extraDataToSave[key] = extraFields[key];
      }
    }
    if (Object.keys(extraDataToSave).length > 0) {
      const existing = (employee.contract_extra_data as Record<string, string>) || {};
      await supabase
        .from("employees")
        .update({ contract_extra_data: { ...existing, ...extraDataToSave } })
        .eq("id", employeeId);
    }

    doc.render(templateData);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;
    const uint8 = new Uint8Array(buf);

    const fileName =
      contractType === "labor"
        ? `Hop-dong-lao-dong_${employee.full_name || employee.employee_code}.docx`
        : `Hop-dong-khoan-viec_${employee.full_name || employee.employee_code}.docx`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (err) {
    console.error("Contract generation error:", err);
    return NextResponse.json(
      { error: "Lỗi tạo hợp đồng: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 },
    );
  }
}
