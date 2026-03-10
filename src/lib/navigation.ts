import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  Users,
  CalendarCheck,
  BarChart3,
  DollarSign,
  UserCog,
  Shield,
} from "lucide-react";

export const PAGE_IDS = {
  HOME: "home",
  DASHBOARD: "dashboard",
  ATTENDANCE: "attendance",
  EMPLOYEES: "employees",
  REPORT_ATTENDANCE: "report-attendance",
  REPORT_SALARY: "report-salary",
  ADMIN_USERS: "admin-users",
  ADMIN_ROLES: "admin-roles",
} as const;

export type PageId = (typeof PAGE_IDS)[keyof typeof PAGE_IDS];

export type PageConfig = {
  id: PageId;
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  description: string;
  homeGroup: "nhan-vien" | "he-thong" | null;
  showInSidebar: boolean;
  sidebarLabel?: string;
};

const PAGES: PageConfig[] = [
  {
    id: PAGE_IDS.HOME,
    name: "Trang chủ",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "owner", "manager", "office_staff", "worker"],
    description: "Menu chính",
    homeGroup: null,
    showInSidebar: true,
  },
  {
    id: PAGE_IDS.DASHBOARD,
    name: "Dashboard",
    href: "/dashboard",
    icon: Activity,
    roles: ["admin", "owner", "manager"],
    description: "Điểm danh hôm nay",
    homeGroup: null,
    showInSidebar: false,
  },
  {
    id: PAGE_IDS.ATTENDANCE,
    name: "Điểm danh",
    href: "/attendance",
    icon: CalendarCheck,
    roles: ["admin", "manager", "office_staff"],
    description: "Chấm công theo ngày",
    homeGroup: "nhan-vien",
    showInSidebar: true,
  },
  {
    id: PAGE_IDS.EMPLOYEES,
    name: "Quản lý nhân viên",
    href: "/employees",
    icon: Users,
    roles: ["admin", "manager"],
    description: "Danh sách, thêm/sửa nhân viên",
    homeGroup: "nhan-vien",
    showInSidebar: true,
    sidebarLabel: "Nhân viên",
  },
  {
    id: PAGE_IDS.REPORT_ATTENDANCE,
    name: "Báo cáo điểm danh",
    href: "/reports/attendance",
    icon: BarChart3,
    roles: ["admin", "owner"],
    description: "Thống kê theo kỳ",
    homeGroup: "nhan-vien",
    showInSidebar: false,
  },
  {
    id: PAGE_IDS.REPORT_SALARY,
    name: "Báo cáo lương",
    href: "/reports/salary",
    icon: DollarSign,
    roles: ["admin", "owner"],
    description: "Báo cáo lương",
    homeGroup: null,
    showInSidebar: true,
  },
  {
    id: PAGE_IDS.ADMIN_USERS,
    name: "Quản lý User",
    href: "/admin/users",
    icon: UserCog,
    roles: ["admin"],
    description: "Tài khoản đăng nhập hệ thống",
    homeGroup: "he-thong",
    showInSidebar: true,
  },
  {
    id: PAGE_IDS.ADMIN_ROLES,
    name: "Quản lý Role",
    href: "/admin/roles",
    icon: Shield,
    roles: ["admin"],
    description: "Quản lý vai trò hệ thống",
    homeGroup: "he-thong",
    showInSidebar: true,
  },
];

export { PAGES };

export function getRouteRoles(pathname: string): string[] | null {
  const sorted = [...PAGES].sort((a, b) => b.href.length - a.href.length);
  const page = sorted.find(
    (p) => pathname === p.href || pathname.startsWith(p.href + "/"),
  );
  return page?.roles ?? null;
}

export function getPageById(id: PageId): PageConfig | undefined {
  return PAGES.find((p) => p.id === id);
}

export function filterPagesByRole(
  pages: PageConfig[],
  roleName: string | null,
): PageConfig[] {
  if (!roleName) return [];
  return pages.filter((p) => p.roles.includes(roleName));
}

export function getSidebarPages(roleName: string | null): PageConfig[] {
  return filterPagesByRole(
    PAGES.filter((p) => p.showInSidebar),
    roleName,
  );
}

export function getHomeGroupPages(
  group: "nhan-vien" | "he-thong",
  roleName: string | null,
): PageConfig[] {
  return filterPagesByRole(
    PAGES.filter((p) => p.homeGroup === group && p.showInSidebar),
    roleName,
  );
}

const EXTRA_TITLES: Record<string, string> = {
  "/employees/new": "Thêm nhân viên",
  "/profile": "Hồ sơ",
};

export function getPageTitleForPath(pathname: string): string {
  if (EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname];
  const sorted = [...PAGES].sort((a, b) => b.href.length - a.href.length);
  const page = sorted.find(
    (p) => pathname === p.href || pathname.startsWith(p.href + "/"),
  );
  return page ? (page.sidebarLabel ?? page.name) : "LEGIFood";
}
