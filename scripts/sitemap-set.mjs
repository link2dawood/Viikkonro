import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// dist/sitemap.xml is a <sitemapindex> over per-type children
// (sitemap-weeks.xml, sitemap-holidays.xml, sitemap-calendars.xml,
// sitemap-pages.xml), so the page URLs live one level down. Everything that
// wants "every indexable URL the site publishes" - the crawl check and the
// generated-artifact cases - reads the children through here, so the split
// stays a packaging detail and no check silently narrows to four <loc>s.
export function childSitemapFiles() {
  const index = readFileSync(path.join(root, "dist/sitemap.xml"), "utf8");
  const files = [
    ...index.matchAll(/<loc>[^<]*\/(sitemap-[^/<]+\.xml)<\/loc>/g),
  ].map((match) => match[1]);
  if (!files.length) {
    throw new Error("dist/sitemap.xml references no child sitemaps");
  }
  return files;
}

export function readSitemapSet() {
  return childSitemapFiles()
    .map((file) => readFileSync(path.join(root, "dist", file), "utf8"))
    .join("\n");
}
