import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import RouteErrorBoundary from "./RouteErrorBoundary";

describe("RouteErrorBoundary", () => {
  it("renders children when there is no error", () => {
    const html = renderToString(
      <MemoryRouter>
        <RouteErrorBoundary>
          <div>Normaali sisältö</div>
        </RouteErrorBoundary>
      </MemoryRouter>
    );
    expect(html).toContain("Normaali sisältö");
  });

  it("updates state on error via getDerivedStateFromError", () => {
    const error = new Error("Chunk failed to load");
    const state = RouteErrorBoundary.getDerivedStateFromError(error);
    expect(state).toEqual({ hasError: true, error });
  });

  it("renders fallback UI when hasError is true", () => {
    const boundary = new RouteErrorBoundary({ children: "child" });
    boundary.state = { hasError: true, error: new Error("failed") };

    // Test online fallback
    const onlineHtml = renderToString(<MemoryRouter>{boundary.render()}</MemoryRouter>);
    expect(onlineHtml).toContain("Sivun lataus epäonnistui");
    expect(onlineHtml).toContain("Yritä uudelleen");
    expect(onlineHtml).toContain("Palaa etusivulle");
    expect(onlineHtml).not.toContain("–"); // SEO constitution: no en-dash
  });
});
