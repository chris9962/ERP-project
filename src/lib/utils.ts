import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROLE_LABELS: Record<string, string> = {
  worker: "Công nhân",
  office_staff: "Văn phòng",
  manager: "Quản lý",
  owner: "Chủ sở hữu",
  admin: "Admin",
};

export function getRoleLabel(roleName: string | null | undefined): string {
  if (!roleName) return "—";
  return ROLE_LABELS[roleName] ?? roleName;
}
