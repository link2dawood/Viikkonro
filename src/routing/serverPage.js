const modules = import.meta.glob(["../pages/*.jsx", "!../pages/*.test.jsx"], { eager: true });

// renderToString cannot wait for lazy imports. Only the SSR/test build imports
// this module, so every generated page contains its complete content.
export function routePage(name, exportName = "default") {
  const Component = modules[`../pages/${name}.jsx`]?.[exportName];
  if (!Component) throw new Error(`Missing ${exportName} in ${name}`);
  Component.routeModule = `src/pages/${name}.jsx`;
  return Component;
}
