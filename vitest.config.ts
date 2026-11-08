import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@astria/ui": path.resolve(import.meta.dirname, "../ui/src/index.ts") },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
  },
});
