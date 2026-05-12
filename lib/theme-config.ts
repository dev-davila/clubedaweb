import { prisma } from "@/lib/db";

export interface ThemeBrand {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  textLightColor: string;
  backgroundColor: string;
  surfaceColor: string;
  fontPrimary: string;
  fontSecondary: string;
  fontHeading: string;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoIconUrl: string | null;
  styleType: string;
  borderRadius: string;
  buttonStyle: string;
  iconStyle: string;
}

export const DEFAULT_BRAND: ThemeBrand = {
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  accentColor: "#10B981",
  textColor: "#1F2937",
  textLightColor: "#6B7280",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F9FAFB",
  fontPrimary: "'Inter', sans-serif",
  fontSecondary: "'JetBrains Mono', monospace",
  fontHeading: "'Manrope', sans-serif",
  logoUrl: "/images/logo-m3solutions.svg",
  logoLightUrl: "/images/logo-m3solutions.svg",
  logoIconUrl: null,
  styleType: "corporate",
  borderRadius: "8px",
  buttonStyle: "rounded",
  iconStyle: "solid",
};

export async function getActiveBrand(): Promise<ThemeBrand> {
  try {
    const brand = await prisma.brandTokens.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });
    if (!brand) return DEFAULT_BRAND;
    return {
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      accentColor: brand.accentColor,
      textColor: brand.textColor,
      textLightColor: brand.textLightColor,
      backgroundColor: brand.backgroundColor,
      surfaceColor: brand.surfaceColor,
      fontPrimary: brand.fontPrimary,
      fontSecondary: brand.fontSecondary,
      fontHeading: brand.fontHeading,
      logoUrl: brand.logoUrl,
      logoLightUrl: brand.logoLightUrl,
      logoIconUrl: brand.logoIconUrl,
      styleType: brand.styleType,
      borderRadius: brand.borderRadius,
      buttonStyle: brand.buttonStyle,
      iconStyle: brand.iconStyle,
    };
  } catch {
    return DEFAULT_BRAND;
  }
}

function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  if (full.length !== 6) return "0 0% 0%";
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H} ${S}% ${L}%`;
}

function readableForeground(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return "0 0% 100%";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.6 ? "222 47% 11%" : "0 0% 100%";
}

function radiusToRem(value: string): string {
  if (!value) return "0.5rem";
  const trimmed = value.trim();
  if (trimmed.endsWith("rem") || trimmed.endsWith("em")) return trimmed;
  if (trimmed.endsWith("px")) {
    const n = parseFloat(trimmed);
    if (!isNaN(n)) return `${n / 16}rem`;
  }
  const n = parseFloat(trimmed);
  if (!isNaN(n)) return `${n / 16}rem`;
  return "0.5rem";
}

export function brandToCssVars(brand: ThemeBrand): string {
  const primary = hexToHsl(brand.primaryColor);
  const secondary = hexToHsl(brand.secondaryColor);
  const accent = hexToHsl(brand.accentColor);
  const background = hexToHsl(brand.backgroundColor);
  const foreground = hexToHsl(brand.textColor);
  const muted = hexToHsl(brand.surfaceColor);
  const mutedFg = hexToHsl(brand.textLightColor);

  return `:root{
--background:${background};
--foreground:${foreground};
--card:${background};
--card-foreground:${foreground};
--popover:${background};
--popover-foreground:${foreground};
--primary:${primary};
--primary-foreground:${readableForeground(brand.primaryColor)};
--secondary:${secondary};
--secondary-foreground:${readableForeground(brand.secondaryColor)};
--accent:${accent};
--accent-foreground:${readableForeground(brand.accentColor)};
--muted:${muted};
--muted-foreground:${mutedFg};
--destructive:0 84% 60%;
--destructive-foreground:0 0% 100%;
--border:${muted};
--input:${muted};
--ring:${primary};
--radius:${radiusToRem(brand.borderRadius)};
--brand-primary:${primary};
--brand-secondary:${secondary};
--brand-accent:${accent};
--font-heading:${brand.fontHeading};
--font-body:${brand.fontPrimary};
}`;
}
