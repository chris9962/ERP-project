import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSalaryLabel(employmentType: string): string {
  return employmentType === "part_time"
    ? "Lương theo ngày (VND)"
    : "Lương tháng (VND)";
}

