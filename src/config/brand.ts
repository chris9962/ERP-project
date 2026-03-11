export type BrandId = "legifood" | "lienhung";

type BrandConfig = {
  name: string;
  logo: string;
  favicon: string;
  emailPrefix: string;
  /** Logo aspect ratio (width / height) for correct rendering */
  logoRatio: number;
  /** Whether to show company name text next to the sidebar logo */
  showSidebarName: boolean;
};

const brands: Record<BrandId, BrandConfig> = {
  legifood: {
    name: "LEGI Food",
    logo: "/brands/legifood/logo.jpeg",
    favicon: "/brands/legifood/logo.jpeg",
    emailPrefix: "legifood",
    logoRatio: 1,
    showSidebarName: true,
  },
  lienhung: {
    name: "Liên Hưng",
    logo: "/brands/lienhung/logo.svg",
    favicon: "/brands/lienhung/logo.svg",
    emailPrefix: "lienhung",
    logoRatio: 1050 / 315,
    showSidebarName: false,
  },
};

const brandId = (process.env.NEXT_PUBLIC_BRAND as BrandId) || "legifood";

export const brand = brands[brandId] ?? brands.legifood;
export { brandId };
