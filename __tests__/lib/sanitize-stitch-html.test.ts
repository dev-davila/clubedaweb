import { sanitizeStitchHtml } from "@/lib/stitch/sanitize-stitch-html";

describe("sanitizeStitchHtml", () => {
  it("fixes style closed as script and trailing garbage", () => {
    const broken = `<!DOCTYPE html><html><head><style>body{color:red}</script></head><body><p>ok</p></body></html></style></head><body></body></html>`;
    const fixed = sanitizeStitchHtml(broken);
    expect(fixed).toContain("</style></head>");
    expect(fixed).not.toContain("</style></head><body></body>");
    expect(fixed).toContain("<p>ok</p>");
    expect(fixed.match(/<\/html>/gi)?.length).toBe(1);
  });
});
