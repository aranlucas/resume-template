/** @type {import('e2e').E2EConfig} */
const config = {
  tests: "test/**/*.e2e.mjs",
  targets: [{ name: "cli", platform: "custom" }],
  workers: 1,
  retries: 0,
  timeout: 120_000,
};

export default config;
