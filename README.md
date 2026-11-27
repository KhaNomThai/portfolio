# Kulachart Parnduangkeaw — Portfolio

![Portfolio preview](public/og-image.png)

Personal portfolio and resume of **Kulachart Parnduangkeaw**, a Computer Engineering student at Srinakharinwirot University focused on Data Science & ML and full-stack development.

**Live site:** https://kulac.dev

## Highlights

- **Shared content.** The website and PDF CV use [`src/data.ts`](src/data.ts). Regenerate the CV after content edits. CI checks the source HTML and PDF checksums.
- **Design system.** A "lab notebook" look built on design tokens in [`src/styles/tokens.css`](src/styles/tokens.css), with light and dark themes. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) explains every token and the rules for using them.
- **Interactive projects.** Filter projects by category or technology. In the skills graph, hover to preview connections or select a skill to open its evidence and filter projects.
- **Project pages.** Every project has its own page at `/projects/<id>` with the approach and how it works, plus technical decisions and screenshots or photos where available. The build writes and checks each page’s title, description, canonical URL and Open Graph tags. The browser loads the interactive Explore view when a project opens.
- **⌘K command palette.** Jump to any section, copy the email, download the CV, or open GitHub/LinkedIn from the keyboard.
- **Accessible.**
  - Semantic landmarks and headings
  - Skip link and visible focus states
  - Screen-reader hints for links that open a new tab
  - Contrast checks for key text, controls and focus rings in both themes
  - Full `prefers-reduced-motion` support
- **Light on motion.** All text is readable at once except the hero name, which writes itself in about a second (screen readers get the full name immediately). Decorative effects are mostly CSS (scroll-driven where the browser supports it) and only change properties that don't affect layout (transform, opacity, filter, backgrounds and drawn strokes), so nothing shifts. Framer Motion loads through `LazyMotion` after the first render and only animates things that follow a click (toast, project filter, hero track lens, skill views); fade-ins are CSS, so content stays visible even if that chunk fails to load.
- **Share-ready.** The build includes Open Graph previews, JSON-LD, a sitemap and `robots.txt`. Projects with a lead screenshot have their own social preview. The HTML summary, contact links and CV stay available if the app cannot start.

## Tech stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 with design tokens · Framer Motion · Newsreader and IBM Plex Sans (self-hosted)

## Getting started

Requires Node.js 26, because the generator scripts run TypeScript directly (`.nvmrc` and `engines` pin Node 26, the version Vercel builds with). GitHub Actions runs `check:release` and the browser smoke suite on every push and pull request.

```bash
npm install
npm run dev           # http://localhost:5173
npm run build         # type-check, build and verify dist/ HTML, OG images, sitemap and CV
npm run preview       # serve the production build locally
npx playwright install webkit firefox
npm run check:release # lint, token, data and build checks, CV sync, then build
npm run test:smoke    # after build, test dist/ in Chrome, WebKit and Firefox
npm run lint
npm run check:tokens  # find Tailwind default classes that the design tokens turned off
npm run check:data    # validate tags, highlights, home metadata and fallback, charts and media
npm run cv -- --check # verify the HTML and PDF checksums
npm run photos        # crop activity photos from the local, uncommitted Picture/ into src/assets/images/experience/<id>/
npm run shots         # capture project demo screenshots into src/assets/images/projects/<id>/ (append -- <id> for one)
```

Playwright starts Vite preview on port 4189. Use `CHROME_PATH` for a custom Chrome installation. Smoke tests cover direct links and 404s, CV downloads, HTML fallback if the app or Explore chunk fails, modal navigation, media retry and playback, graph controls and computed contrast.

Run `check:tokens` after UI changes. `tokens.css` turns off Tailwind's default colors, font sizes, fonts, radii and shadows. Tailwind doesn't report an unknown class; it just generates no CSS for it, so lint and build still pass while the page breaks.

## Updating content

1. Edit [`src/data.ts`](src/data.ts). It holds the profile, projects, experience, skills, and education. See the owner decisions in AGENTS.md before changing facts that have already been settled.
2. Regenerate the PDF CV with `npm run cv`. It produces a two-page overview across AI / Data, web, mobile and leadership. The script validates both A4 pages before replacing `src/assets/Kulachart-Parnduangkeaw-CV.pdf`. Commit it together with `src/assets/cv.sha256`. CI verifies both the current HTML and the PDF file against the saved checksums.

   `CV_PROJECTS` and `CV_LEADERSHIP` in [`scripts/build-cv.ts`](scripts/build-cv.ts) pick the entries by id, and `cvProfile`, `cvDetails` and the other CV-specific exports in `data.ts` keep that wording out of the browser’s JavaScript. The project names in the PDF link to their Explore pages.
3. Regenerate the link-preview image with `npm run og` after changing any of these:
   - the name, `focus`, `role`, `school`, `availability` or `siteUrl`
   - the first three `highlights`
   - the profile photo
   - a color used by the preview or `design/logo/k-serif.svg`

   The output is `public/og-image.png`. Project-specific previews use the lead image from `projectMedia` or `projectGallery` in `src/config/projectMedia.ts` and are created by `npm run build`.
4. If the edit changes the home page’s metadata or HTML fallback, update the corresponding values in `index.html` and run `npm run check:data`.

`npm run cv`, `og` and `shots` use headless Google Chrome. If Chrome isn't in its default location, set `CHROME_PATH`.

A new skill or project tag also needs an entry in [`src/config/skillFamilies.ts`](src/config/skillFamilies.ts), or it is listed under Tools; `npm run check:data` catches this. To show a logo for it, add one to [`src/config/skillLogos.ts`](src/config/skillLogos.ts).

## Project structure

```
src/
├── data.ts                 # all website + CV content
├── styles/tokens.css       # design tokens: colors, type, spacing, radii, shadow, motion
├── index.css               # base styles and decorative utilities built on the tokens
├── config/
│   ├── experienceMedia.ts # photos and videos per experience or project id
│   ├── projectMedia.ts     # screenshots and gallery per project id
│   ├── sections.ts         # section ids/labels shared by nav, ⌘K palette, and scroll-spy
│   ├── skillFamilies.ts    # skill → family (ML / DL, Data, Full-stack, Languages)
│   └── skillLogos.ts       # brand logo paths from Simple Icons, loaded as a separate chunk
├── sections/               # Hero, Projects, Experience, Skills, Education, Contact
├── components/             # Navbar, CommandPalette, ProjectPage, LabFigure, Lightbox, MediaImage, Toast, …
├── lib/                    # hooks and helpers: theme, router, scroll-spy, clipboard, highlighter, …
├── types/                  # type declarations (CSS custom properties in `style`)
└── assets/                 # generated CV, images/ (profile, experience, projects) and videos/
scripts/                    # CV PDF, og:image, photo and screenshot generators, token, data and build checks
tests/portfolio.spec.ts     # smoke tests against the built site
vite.config.ts              # static project pages, social images and font preload
design/logo/                # source files of the Serif K. logo
DESIGN_SYSTEM.md            # what every token means and how to use it
```

## Browser support

The CSS targets [Tailwind v4’s browser baseline](https://tailwindcss.com/docs/compatibility). Smoke tests use the installed Chrome and Playwright’s WebKit and Firefox builds.

| Browser family | CSS baseline | Smoke profile |
| --- | --- | --- |
| Chrome | 111+ | Desktop and narrow mobile viewports in both themes |
| Safari | 16.4+ | Playwright WebKit at 375px with simulated touch |
| Firefox | 128+ | Playwright Firefox on desktop |

Run Safari on iOS for dialog, keyboard and touch changes. A test on current WebKit leaves compatibility with the minimum Safari version to verify separately.

If Playwright Firefox reports a missing profile on macOS 27, run the Firefox profile in the matching [Playwright Linux container](https://playwright.dev/docs/docker).

## Deployment

The site is deployed on Vercel with the Vite preset. A push to `main` starts the deployment. Vercel builds with `npm run check:release`, and its Deployment Checks hold the new build off the production domain until the GitHub Actions `check` job (the same checks plus browser smoke tests) passes. Renaming that job means selecting it again in the Vercel project settings. Run `npm run check:release && npm run test:smoke` before pushing to `main`. Use a Vercel Preview deployment to verify rewrite, 404 and download headers before release if those settings change. After an authorized push, check the production deployment and CI for the same revision, then open a direct project link on the live domain and download the CV.

The [TangLat interactive demo](https://khanomthai.github.io/project-cpe101/) is hosted on GitHub Pages from the [separate Prim visualizer repository](https://github.com/KhaNomThai/project-cpe101).
