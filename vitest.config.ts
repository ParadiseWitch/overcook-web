import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/game/**/*.ts"],
      exclude: [
        "src/game/**/*.test.ts",
        "src/__mocks__/**",
        "src/__test-utils__/**",
        "src/game/scenes/**",
        "src/game/player/**",
        "src/game/physics/**",
        "src/game/manager/**",
        "src/game/main.ts",
        "src/game/types/**",
      ],
    },
    setupFiles: ["./src/__test-utils__/setup.ts"],
  },
});