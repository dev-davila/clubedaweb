import { readFileSync } from "fs";
import { join } from "path";
import {
  buildStandardHeader,
  extractChromeFromHome,
  standardizeSiteChrome,
} from "@/lib/stitch/standardize-chrome";
import { SITE_PAGE_ROUTES } from "@/lib/themes/required-pages";

const dir = join(process.cwd(), "tmp", "stitch-five");

describe("standardize-chrome", () => {
  it("extracts header/footer from home", () => {
    const home = readFileSync(join(dir, "home.html"), "utf8");
    const chrome = extractChromeFromHome(home);
    expect(chrome.headerShell).toContain('data-block="header"');
    expect(chrome.footer).toContain('data-block="footer"');
    expect(chrome.footer).toContain("Links Úteis");
  });

  it("marks active nav link per page", () => {
    const home = readFileSync(join(dir, "home.html"), "utf8");
    const chrome = extractChromeFromHome(home);
    const contactHeader = buildStandardHeader(chrome, "contact");
    expect(contactHeader).toContain(`href="${SITE_PAGE_ROUTES.contact}"`);
    expect(contactHeader).toContain(
      'font-bold border-b-2 border-primary py-2" href="/contato"',
    );
  });

  it("unifies chrome across pages", () => {
    const pages = {
      home: readFileSync(join(dir, "home.html"), "utf8"),
      about: readFileSync(join(dir, "about.html"), "utf8"),
      contact: readFileSync(join(dir, "contact.html"), "utf8"),
      services: readFileSync(join(dir, "services.html"), "utf8"),
      blog: readFileSync(join(dir, "blog.html"), "utf8"),
    };
    const out = standardizeSiteChrome(pages, "home");
    const aboutFooter = out.about.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? "";
    const homeFooter = out.home.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? "";
    expect(aboutFooter).toBe(homeFooter);
    expect(out.contact).toContain('data-block="header"');
    expect(out.contact).toContain("hidden md:flex items-center gap-6");
  });
});
