import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const swPath = path.join(rootDir, "service-worker.js");
const appJsPath = path.join(rootDir, "app.js");
const srcAppJsPath = path.join(rootDir, "src/app.js");

describe("service worker and offline functionality", () => {
  it("creates service-worker.js in the root directory", () => {
    expect(fs.existsSync(swPath)).toBe(true);
  });

  it("specifies cache name and essential assets (HTML, CSS, JS, icons)", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toMatch(/CACHE_NAME\s*=/);
    expect(content).toMatch(/\.html/);
    expect(content).toMatch(/\.css/);
    expect(content).toMatch(/\.js|\.jsx/);
    expect(content).toMatch(/\.svg|\.png|\.webp|icon/);
  });

  it("handles install, activate, and fetch events in service worker", () => {
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("addEventListener('install'");
    expect(content).toContain("addEventListener('activate'");
    expect(content).toContain("addEventListener('fetch'");
    expect(content).toContain("caches.open");
    expect(content).toContain("addAll");
    expect(content).toContain("caches.delete");
    expect(content).toContain("caches.match");
    expect(content).toContain("respondWith");
  });

  it("creates app.js and registers the service worker", () => {
    expect(fs.existsSync(appJsPath)).toBe(true);
    expect(fs.existsSync(srcAppJsPath)).toBe(true);

    const rootAppContent = fs.readFileSync(appJsPath, "utf-8");
    const srcAppContent = fs.readFileSync(srcAppJsPath, "utf-8");

    expect(rootAppContent).toContain("serviceWorker");
    expect(rootAppContent).toContain("register('/service-worker.js')");
    expect(srcAppContent).toContain("serviceWorker");
    expect(srcAppContent).toContain("register('/service-worker.js')");
  });
});

describe("service worker runtime events", () => {
  let listeners;
  let mockCaches;
  let mockCache;

  beforeEach(() => {
    listeners = {};
    mockCache = {
      addAll: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      match: vi.fn(),
    };
    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      keys: vi.fn().mockResolvedValue(["old-cache-v0", "iso-week-number-cache-v1"]),
      delete: vi.fn().mockResolvedValue(true),
      match: vi.fn(),
    };

    globalThis.self = {
      addEventListener: (event, handler) => {
        listeners[event] = handler;
      },
      skipWaiting: vi.fn().mockResolvedValue(undefined),
      clients: {
        claim: vi.fn().mockResolvedValue(undefined),
      },
    };
    globalThis.caches = mockCaches;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-caches assets on install and skips waiting", async () => {
    const swContent = fs.readFileSync(swPath, "utf-8");
    const runSw = new Function("self", "caches", swContent);
    runSw(globalThis.self, globalThis.caches);

    expect(listeners.install).toBeDefined();

    let waitPromise;
    const installEvent = {
      waitUntil: vi.fn((promise) => {
        waitPromise = promise;
      }),
    };

    listeners.install(installEvent);
    await waitPromise;

    expect(mockCaches.open).toHaveBeenCalled();
    expect(mockCache.addAll).toHaveBeenCalled();
    const cachedUrls = mockCache.addAll.mock.calls[0][0];
    expect(cachedUrls).toContain("/");
    expect(cachedUrls).toContain("/index.html");
  });

  it("deletes old caches and claims clients on activate", async () => {
    const swContent = fs.readFileSync(swPath, "utf-8");
    const runSw = new Function("self", "caches", swContent);
    runSw(globalThis.self, globalThis.caches);

    expect(listeners.activate).toBeDefined();

    let waitPromise;
    const activateEvent = {
      waitUntil: vi.fn((promise) => {
        waitPromise = promise;
      }),
    };

    listeners.activate(activateEvent);
    await waitPromise;

    expect(mockCaches.keys).toHaveBeenCalled();
    expect(mockCaches.delete).toHaveBeenCalledWith("old-cache-v0");
    expect(mockCaches.delete).not.toHaveBeenCalledWith("iso-week-number-cache-v1");
  });

  it("serves from cache first, and falls back to network when not in cache", async () => {
    const swContent = fs.readFileSync(swPath, "utf-8");
    const runSw = new Function("self", "caches", swContent);
    runSw(globalThis.self, globalThis.caches);

    expect(listeners.fetch).toBeDefined();

    // 1. Cache hit test
    const mockCachedResponse = { status: 200, body: "from-cache" };
    mockCaches.match.mockResolvedValueOnce(mockCachedResponse);

    let respondPromise1;
    const fetchEvent1 = {
      request: { url: "https://viikkonro.fi/", method: "GET" },
      respondWith: vi.fn((promise) => {
        respondPromise1 = promise;
      }),
    };

    listeners.fetch(fetchEvent1);
    const result1 = await respondPromise1;
    expect(result1).toBe(mockCachedResponse);

    // 2. Cache miss -> network fallback
    mockCaches.match.mockResolvedValueOnce(null);
    const mockNetworkResponse = {
      status: 200,
      type: "basic",
      clone: vi.fn().mockReturnValue({ status: 200 }),
    };
    globalThis.fetch = vi.fn().mockResolvedValueOnce(mockNetworkResponse);

    let respondPromise2;
    const fetchEvent2 = {
      request: { url: "https://viikkonro.fi/about", method: "GET" },
      respondWith: vi.fn((promise) => {
        respondPromise2 = promise;
      }),
    };

    listeners.fetch(fetchEvent2);
    const result2 = await respondPromise2;
    expect(globalThis.fetch).toHaveBeenCalledWith(fetchEvent2.request);
    expect(result2).toBe(mockNetworkResponse);
  });
});
