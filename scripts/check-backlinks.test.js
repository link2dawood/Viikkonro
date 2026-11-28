import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBacklinks, findLinks, readBacklinkList } from "./check-backlinks.js";

describe("backlink checker", () => {
  it("finds links to viikkonro.fi with rel flags and anchor text", () => {
    const html = `
      <a href="https://viikkonro.fi/">Viikko <b>Nro</b></a>
      <a href='https://www.viikkonro.fi/kalenteri-2026' rel="nofollow noopener">kalenteri</a>
      <a href="/local">local</a>
      <a href="https://example.com/">other</a>
      <a rel="sponsored" href="https://viikkonro.fi/laskurit">laskurit</a>`;
    const links = findLinks(html, "https://example.fi/sivu");
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject({ target: "https://viikkonro.fi/", text: "Viikko Nro", nofollow: false });
    expect(links[1]).toMatchObject({ nofollow: true });
    expect(links[2]).toMatchObject({ sponsored: true });
  });

  // The reason to monitor a known backlink is the equity it passes, so a page
  // that keeps the link but turns it nofollow has to fail the check, not pass
  // it with a cosmetic "nofollow only" label.
  it.each([
    ['<a href="https://viikkonro.fi/">viikkonro</a>', true, "dofollow"],
    ['<a href="https://viikkonro.fi/" rel="nofollow">viikkonro</a>', false, "nofollow only"],
    ['<a href="https://viikkonro.fi/" rel="sponsored noopener">viikkonro</a>', false, "nofollow only"],
    ['<a href="https://viikkonro.fi/" rel="ugc">viikkonro</a>', false, "nofollow only"],
    ['<a href="https://example.com/">muu</a>', false, "link missing"],
  ])("rates %s as ok=%s", async (html, ok, state) => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, url: "https://partner.es/x", text: async () => html }));
    vi.stubGlobal("fetch", fetchMock);
    const [result] = await checkBacklinks(["https://partner.es/x"]);
    expect(result).toMatchObject({ ok, state });
    vi.unstubAllGlobals();
  });

  it("reads the list, skipping comments and blank lines", () => {
    const file = path.join(os.tmpdir(), `backlinks-${process.pid}.txt`);
    fs.writeFileSync(file, "# comment\n\nhttps://a.fi/x   # note\nnot a url\nhttp://b.fi/\n");
    expect(readBacklinkList(file)).toEqual(["https://a.fi/x", "http://b.fi/"]);
    fs.unlinkSync(file);
  });
});
