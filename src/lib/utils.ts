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

export const EMPLOYEE_ROLE_OPTIONS = [
  { value: "worker", label: "Công nhân" },
  { value: "office_staff", label: "Văn phòng" },
  { value: "manager", label: "Quản lý" },
] as const;

export function getRoleLabel(roleName: string | null | undefined): string {
  if (!roleName) return "—";
  return ROLE_LABELS[roleName] ?? roleName;
}
