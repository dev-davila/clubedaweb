import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { standardizeSiteChrome } from "../lib/stitch/standardize-chrome";
import { sanitizeStitchHtml } from "../lib/stitch/sanitize-stitch-html";
import { REQUIRED_PAGE_TYPES, type RequiredPageType } from "../lib/themes/required-pages";

const dir = join(process.cwd(), "tmp", "stitch-five");

const pages = {} as Record<RequiredPageType, string>;
for (const pageType of REQUIRED_PAGE_TYPES) {
  const path = join(dir, `${pageType}.html`);
  pages[pageType] = sanitizeStitchHtml(readFileSync(path, "utf8"));
}

const unified = standardizeSiteChrome(pages, "home");
for (const pageType of REQUIRED_PAGE_TYPES) {
  writeFileSync(join(dir, `${pageType}.html`), unified[pageType], "utf8");
  console.log("sanitized + chrome", pageType);
}
