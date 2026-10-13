import { createElement, use } from "react";

const modules = import.meta.glob(["../pages/*.jsx", "!../pages/*.test.jsx"]);

// The initial route is resolved before hydration; subsequent routes suspend
// inside the shared boundary while Vite loads their code and CSS.
export function routePage(name, exportName = "default") {
  const load = modules[`../pages/${name}.jsx`];
  if (!load) throw new Error(`Unknown page: ${name}`);
  let Component, pending;
  const preload = () => pending ??= load().then(module => {
    Component = module[exportName];
    if (!Component) throw new Error(`Missing ${exportName} in ${name}`);
    return { default: Component };
  });
  const Page = props => {
    // Read the cached module promise during navigation. The committed child
    // always has the real page type, so later renders keep its form state.
    const Resolved = Component ?? use(preload()).default;
    return createElement(Resolved, props);
  };
  Page.preload = preload;
  Page.routeModule = `src/pages/${name}.jsx`;
  return Page;
}
