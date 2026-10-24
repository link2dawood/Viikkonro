import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { CONSENT_VERSION } from "./consent.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function commands(stored) {
  const window = { localStorage: { getItem: () => stored } };
  window.window = window;
  vm.runInNewContext(bootstrap, window);
  return window.dataLayer.map((args) => Array.from(args));
}

describe("Google tag bootstrap", () => {
  it("loads the requested measurement ID once in the public head", () => {
    expect(html.match(/src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-B1M6291M6C"/g)).toHaveLength(1);
    expect(html.indexOf("gtag('consent', 'default'")).toBeLessThan(html.indexOf("gtag('config'"));
    expect(html.indexOf("gtag('config'")).toBeLessThan(html.indexOf("</head>"));
  });

  it.each([null, "{invalid", JSON.stringify({ v: CONSENT_VERSION - 1, analytics: true }), JSON.stringify({ v: CONSENT_VERSION, analytics: false })])("keeps storage denied for an absent or ungranted choice: %s", (stored) => {
    const queue = commands(stored);
    expect(queue[0]).toEqual(["consent", "default", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    }]);
    expect(queue.map((args) => args[0])).toEqual(["consent", "js", "config"]);
    expect(queue.at(-1)).toEqual(["config", "G-B1M6291M6C"]);
  });

  it("restores a current grant before the first measurement", () => {
    const queue = commands(JSON.stringify({ v: CONSENT_VERSION, analytics: true }));
    expect(queue[1]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
    expect(queue.at(-1)).toEqual(["config", "G-B1M6291M6C"]);
  });
});
