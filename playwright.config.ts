import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4189";

export default defineConfig({
  testDir: "./tests",
  workers: 2,
  use: { baseURL, reducedMotion: "reduce" },
  projects: [
    ...(["light", "dark"] as const).flatMap((colorScheme) =>
      (["mobile", "desktop"] as const).map((screen) => ({
        name: `${screen}-${colorScheme}`,
        use: {
          channel: "chrome",
          launchOptions: { executablePath: process.env.CHROME_PATH },
          viewport: screen === "mobile" ? { width: 320, height: 568 } : { width: 1280, height: 800 },
          colorScheme,
          hasTouch: screen === "mobile",
          reducedMotion: screen === "desktop" && colorScheme === "dark" ? "no-preference" as const : "reduce" as const,
        },
      }))
    ),
    { name: "webkit-mobile", use: { browserName: "webkit", viewport: { width: 375, height: 812 }, colorScheme: "dark", hasTouch: true } },
    { name: "firefox-desktop", use: { browserName: "firefox", viewport: { width: 1280, height: 800 }, colorScheme: "light" } },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4189 --strictPort",
    url: baseURL,
  },
});
