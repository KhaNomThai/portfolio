import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4189";

export default defineConfig({
  testDir: "./tests",
  workers: 2,
  use: {
    baseURL,
    channel: "chrome",
    launchOptions: { executablePath: process.env.CHROME_PATH },
    reducedMotion: "reduce",
  },
  projects: [
    { name: "mobile-light", use: { viewport: { width: 320, height: 568 }, colorScheme: "light" } },
    { name: "mobile-dark", use: { viewport: { width: 320, height: 568 }, colorScheme: "dark" } },
    { name: "desktop-light", use: { viewport: { width: 1280, height: 800 }, colorScheme: "light" } },
    { name: "desktop-dark", use: { viewport: { width: 1280, height: 800 }, colorScheme: "dark" } },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4189 --strictPort",
    url: baseURL,
  },
});
