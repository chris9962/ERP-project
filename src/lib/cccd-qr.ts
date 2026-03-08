/**
 * Parse QR content from Vietnam CCCD (Căn cước công dân).
 * QR có thể là JSON hoặc chuỗi phân tách (| hoặc ,).
 */
export type CCCDQRData = {
  fullName: string;
  cccdNumber: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
};

export function parseCCCDFromQR(raw: string): CCCDQRData | null {
  const t = raw.trim();
  if (!t) return null;

  // Thử parse JSON (một số app/API trả về JSON)
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const name =
      typeof j.name === "string"
        ? j.name
        : typeof j.fullName === "string"
          ? j.fullName
          : typeof j.hoten === "string"
            ? j.hoten
            : "";
    const id =
      typeof j.id === "string"
        ? j.id
        : typeof j.cccd === "string"
          ? j.cccd
          : typeof j.soCCCD === "string"
            ? j.soCCCD
            : null;
    const dob =
      typeof j.dob === "string"
        ? j.dob
        : typeof j.ngaySinh === "string"
          ? j.ngaySinh
          : null;
    const address =
      typeof j.address === "string"
        ? j.address
        : typeof j.diaChi === "string"
          ? j.diaChi
          : null;
    const gender =
      typeof j.gender === "string"
        ? j.gender
        : typeof j.gioiTinh === "string"
          ? j.gioiTinh
          : null;
    if (name) {
      return {
        fullName: name,
        cccdNumber: id || null,
        dob: dob || null,
        address: address || null,
        gender: gender || null,
      };
    }
  } catch {
    // Không phải JSON, xử lý chuỗi phân tách
  }

  // Định dạng phổ biến: các trường phân tách bởi | hoặc ,
  const sep = t.includes("|") ? "|" : ",";
  const parts = t.split(sep).map((p) => p.trim());

  // Một số format: [id, oldId?, name, dob?, gender?, address?, ...]
  // Giả định ít nhất 3 phần: id, name, (có thể dob...)
  if (parts.length >= 2) {
    // Trường đầu thường là số CCCD (12 chữ số), tiếp theo có thể là tên
    const maybeId = parts[0];
    const numericId = /^\d{9,12}$/.test(maybeId) ? maybeId : null;
    let name = "";
    let dob: string | null = null;
    let address: string | null = null;
    let gender: string | null = null;

    if (parts.length === 2) {
      name = numericId ? parts[1] : parts[0];
    } else {
      // >= 3: thường id, name, dob hoặc id, oldId, name, dob, gender, address
      if (numericId) {
        name = parts[2] ?? parts[1] ?? "";
        dob = parts[3] ?? null;
        gender = parts[4] ?? null;
        address = parts[5] ?? null;
      } else {
        name = parts[0] ?? "";
        dob = parts[1] ?? null;
        address = parts[2] ?? null;
      }
    }

    if (name) {
      return {
        fullName: name,
        cccdNumber: numericId,
        dob: dob || null,
        address: address || null,
        gender: gender || null,
      };
    }
  }

  // Fallback: trả về raw string (không giới hạn độ dài)
  if (t.length >= 2) {
    return {
      fullName: t,
      cccdNumber: null,
      dob: null,
      address: null,
      gender: null,
    };
  }

  return null;
}
