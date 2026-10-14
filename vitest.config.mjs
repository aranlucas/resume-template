import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  tsconfig: "./jsconfig.json",
  test: {
    environment: "node",
    include: ["test/**/*.test.mjs"],
    // Compiler harnesses change PATH and execute ordered filesystem operations.
    fileParallelism: false,
    maxWorkers: 1,
    sequence: { concurrent: false },
    testTimeout: 60_000,
  },
});
