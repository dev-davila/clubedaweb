import type { ThemeRequiredPages } from "../required-pages";
import { m3RequiredPageLayouts } from "./m3";
import { bitdefenderRequiredPageLayouts } from "./bitdefender";

export type ThemeLayoutKey = "m3" | "bitdefender";

export function buildRequiredPageLayouts(
  themeKey: ThemeLayoutKey,
  companyName: string,
  tagline: string,
): ThemeRequiredPages {
  switch (themeKey) {
    case "bitdefender":
      return bitdefenderRequiredPageLayouts(companyName, tagline);
    case "m3":
    default:
      return m3RequiredPageLayouts(companyName, tagline);
  }
}

export { m3RequiredPageLayouts, bitdefenderRequiredPageLayouts };
