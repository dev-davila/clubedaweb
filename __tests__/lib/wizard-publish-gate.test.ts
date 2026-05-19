import { assertPublishablePages } from "@/lib/stitch/published-pages";
import { STITCH_PAGE_MIN_BYTES } from "@/lib/cms/site-block-standard";

describe("assertPublishablePages", () => {
  it("requires all five pages with min bytes", () => {
    const html = "x".repeat(STITCH_PAGE_MIN_BYTES.home + 100);
    const check = assertPublishablePages({
      home: html,
      about: "x".repeat(STITCH_PAGE_MIN_BYTES.about + 10),
      contact: `<form>${"x".repeat(STITCH_PAGE_MIN_BYTES.contact)}</form>`,
      services: "x".repeat(STITCH_PAGE_MIN_BYTES.services + 10),
      blog: `${"<article></article>".repeat(3)}${"x".repeat(STITCH_PAGE_MIN_BYTES.blog)}`,
    });
    expect(check.ok).toBe(true);
  });

  it("reports missing pages", () => {
    const check = assertPublishablePages({ home: "x".repeat(5000) });
    expect(check.ok).toBe(false);
    expect(check.missing).toContain("about");
  });
});
