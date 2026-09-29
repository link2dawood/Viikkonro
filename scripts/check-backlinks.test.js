import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findLinks, readBacklinkList } from "./check-backlinks.js";

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

  it("reads the list, skipping comments and blank lines", () => {
    const file = path.join(os.tmpdir(), `backlinks-${process.pid}.txt`);
    fs.writeFileSync(file, "# comment\n\nhttps://a.fi/x   # note\nnot a url\nhttp://b.fi/\n");
    expect(readBacklinkList(file)).toEqual(["https://a.fi/x", "http://b.fi/"]);
    fs.unlinkSync(file);
  });
});
