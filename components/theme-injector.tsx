import { brandToCssVars, getActiveBrand } from "@/lib/theme-config";

export async function ThemeInjector() {
  const brand = await getActiveBrand();
  const css = brandToCssVars(brand);
  return <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: css }} />;
}
