import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Mirror Nuxt's aliases so utils/ and store/ can be imported in tests.
  resolve: {
    alias: {
      "~~": path.resolve(__dirname, "."),
      "~": path.resolve(__dirname, "."),
      "@@": path.resolve(__dirname, "."),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
