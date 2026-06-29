/** @type {import('jest').Config} */
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  // Coverage is collected for reporting only. No hard global threshold yet —
  // web has one unit suite (the script/Ninglish util); raising the floor is
  // tracked alongside adding component tests. Don't fail CI on aspirational %.
  collectCoverageFrom: ["lib/script.ts"],
});
