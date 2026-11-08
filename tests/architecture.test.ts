// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "src");
const appDir = path.join(src, "app");
const uiNavigation = path.resolve(root, "../ui/src/components/navigation.tsx");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const rel = (file: string) => path.relative(root, file).replaceAll("\\", "/");
const read = (file: string) => readFileSync(file, "utf8");
const files = walk(src);
const code = files.filter((f) => /\.(ts|tsx)$/.test(f));
const isTest = (f: string) => /\.test\.(ts|tsx)$/.test(f);
const inApp = (f: string) => f.startsWith(appDir + path.sep);
const base = (f: string) => path.basename(f);
const hasUseClient = (text: string) => /^\s*(["'])use client\1/.test(text);

/** React and Next hooks that views and layouts must reach only through `use-*.hook.ts` files. */
const directHooks =
  /\b(useState|useEffect|useLayoutEffect|useMemo|useCallback|useReducer|useRef|useTransition|useDeferredValue|useRouter|usePathname|useSearchParams|useParams|useContext)\s*\(/;

describe("route files (SSR only)", () => {
  const routeFiles = code.filter((f) => inApp(f) && /^(page|layout|loading|not-found)\.tsx$/.test(base(f)));
  it("finds route files", () => expect(routeFiles.length).toBeGreaterThan(10));
  it.each(routeFiles.map(rel))("%s is a server component without hooks", (file) => {
    const text = read(path.join(root, file));
    expect(hasUseClient(text)).toBe(false);
    expect(text).not.toMatch(directHooks);
  });
  it.each(routeFiles.filter((f) => base(f) === "page.tsx").map(rel))("%s stays thin (at most 30 lines)", (file) => {
    expect(read(path.join(root, file)).split("\n").length).toBeLessThanOrEqual(30);
  });
  it("keeps error boundaries as client components", () => {
    for (const f of code.filter((f) => inApp(f) && base(f) === "error.tsx")) {
      expect(hasUseClient(read(f))).toBe(true);
    }
  });
});

describe("views and layouts (CSR, no direct hooks)", () => {
  const targets = code.filter((f) => /\.(view|layout)\.tsx$/.test(f));
  it("finds views and layouts", () => expect(targets.length).toBeGreaterThan(15));
  it.each(targets.map(rel))("%s is client-side and calls hooks only through use-*.hook", (file) => {
    const text = read(path.join(root, file));
    expect(hasUseClient(text)).toBe(true);
    expect(text).not.toMatch(directHooks);
  });
  it("keeps views and layouts out of app/", () => {
    expect(targets.filter(inApp)).toEqual([]);
  });
});

describe("hooks", () => {
  const hooks = code.filter((f) => /\.hook\.tsx?$/.test(f) && !isTest(f));
  it("finds hooks", () => expect(hooks.length).toBeGreaterThan(8));
  it.each(hooks.map(rel))("%s is named use-*.hook and exports a use function", (file) => {
    expect(base(file)).toMatch(/^use-[a-z0-9-]+\.hook\.tsx?$/);
    expect(read(path.join(root, file))).toMatch(/export function use[A-Z]\w*/);
  });
  it.each(hooks.map(rel))("%s has a sibling test", (file) => {
    const sibling = path.join(root, file).replace(/\.tsx?$/, ".test.ts");
    const siblingTsx = `${sibling}x`;
    expect([sibling, siblingTsx].some((p) => files.includes(p))).toBe(true);
  });
  it("keeps hook files out of app/", () => {
    expect(hooks.filter(inApp)).toEqual([]);
  });
});

describe("naming and safety", () => {
  it("uses kebab-case file names", () => {
    const bad = files.filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z]+)*\.(ts|tsx|css)$/.test(base(f)));
    expect(bad.map(rel)).toEqual([]);
  });
  it("never uses dangerouslySetInnerHTML", () => {
    expect(code.filter((f) => !isTest(f) && read(f).includes("dangerouslySetInnerHTML")).map(rel)).toEqual([]);
  });
  it("has no Mode juri feature in source", () => {
    const pattern = /mode juri|judge mode|role.*juri|["']juri["']/i;
    expect(code.filter((f) => !isTest(f) && pattern.test(read(f))).map(rel)).toEqual([]);
  });
});

describe("route map", () => {
  const pages = code.filter((f) => inApp(f) && base(f) === "page.tsx");
  const routeOf = (file: string) => {
    const segments = path
      .relative(appDir, path.dirname(file))
      .split(path.sep)
      .filter((s) => s && !/^\(.*\)$/.test(s));
    return `/${segments.join("/")}`;
  };
  const routes = new Set(pages.map(routeOf));
  const nav = read(uiNavigation);
  const hrefs = [...nav.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith("/"));

  it("reads the navigation from @astria/ui", () => expect(hrefs.length).toBeGreaterThanOrEqual(12));
  it.each([...new Set(hrefs)])("navigation target %s has a page", (href) => {
    expect(routes.has(href)).toBe(true);
  });
  it("has a login page and every screen of the design", () => {
    for (const route of ["/login", "/", "/cards", "/cards/[id]", "/digests", "/digests/[id]", "/cases/[id]"]) {
      expect(routes.has(route)).toBe(true);
    }
  });
  it("has loading, error and not-found boundaries for the app group", () => {
    for (const name of ["loading", "error", "not-found"]) {
      expect(files.includes(path.join(appDir, "(app)", `${name}.tsx`))).toBe(true);
    }
  });
  it("has a not-found boundary for each dynamic segment", () => {
    for (const page of pages.filter((f) => f.includes("[id]"))) {
      expect(files.includes(path.join(path.dirname(page), "not-found.tsx"))).toBe(true);
    }
  });
});
