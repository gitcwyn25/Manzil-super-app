/**
 * Unit tests for the API.
 *
 * Deliberately scoped to pure logic and repository units with mocked Prisma —
 * anything needing a live database belongs in the Playwright suite, which runs
 * against a booted server. Unit tests that quietly reach the shared Supabase
 * instance would be slow, order-dependent, and destructive.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  // Decorator metadata is required for anything importing Nest providers.
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          target: "ES2022",
          module: "commonjs"
        }
      }
    ]
  }
};
