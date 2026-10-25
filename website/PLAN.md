# Website build plan

The plan for ROADMAP 9.1: a Next.js site in the `website/` workspace that reads the repo's data and looks like the mockups in `mockups/`. The four open items are settled in [ADR 0011](../docs/adr/0011-website-before-the-build.md). Each ticket names the files it owns; a ticket touches no file another ticket owns.

## Stack

- Next.js (App Router, the current stable release, pinned exactly), React from the root, TypeScript. Every route is generated at build time from the repo's files: `next build` reads them with `node:fs` in server components and `generateStaticParams`. No database, no client fetching of data.
- `@mylder/perron` as a workspace dependency, used as it ships: the site's `dev` and `build` scripts build the package first, and the site imports `@mylder/perron`, `@mylder/perron/patterns` and `@mylder/perron/perron.css`. A preview is the shipped component, never a copy of its markup.
- Styling: `perron.css` once in the root layout, then the site's own CSS reading `var(--perron-*)` only. No raw colour, size, duration or font value in site CSS, and no Tailwind.
- The loaders reuse the repo's own readers where one exists (`scripts/lib/pages.ts` for the foundation pages and their table rows, `scripts/lib/tokens.ts` and `token-sources.ts` for resolved tokens, `packages/mcp/src/*` for the MCP tools), so the site and Storybook show the same data.
- `npm run build -w website` joins the root `npm run check`.

## Routes

| Route                 | Reads                                                                                                                                                                    | Mockup                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `/`                   | `components.json` (counts by layer and status), `data/tokens.json` (token count), the package version, live components from `@mylder/perron`                             | `Home.dc.html`, `Phone-Home.dc.html`     |
| `/get-started`        | `packages/perron/README.md`, the "Using the tokens" section of `docs/foundations/README.md`, the setup in `packages/mcp/README.md`                                       | none: the site's prose page              |
| `/foundations`        | `PAGES` and `readPages()` from `scripts/lib/pages.ts`: one tile per foundation page, drawn from its tokens                                                               | `Foundations.dc.html`                    |
| `/foundations/[slug]` | One page of `docs/foundations/*.md`, plus `docs/content-design.md` at `/foundations/content-design`: prose from the markdown, each table block from `readPages()`'s rows | `Foundations.dc.html`'s tiles, opened    |
| `/components`         | `components.json` (`layer: component`), grouped by `category`; stable entries as cards holding a preview, designing ones listed as in design                             | `Components.dc.html`                     |
| `/components/[slug]`  | `docs/components/<slug>.md` (intro, sections), `api.json` (props), `components.json` (status, category, Base UI parts), a preview per variant and state                  | `Button.dc.html`, `Phone-Button.dc.html` |
| `/patterns`           | `components.json` (`layer: pattern`), pattern previews from `@mylder/perron/patterns`                                                                                    | `Patterns.dc.html`                       |
| `/patterns/[slug]`    | `docs/patterns/<slug>.md`, `api.json`, the same spec-page template as a component                                                                                        | `Button.dc.html`'s layout                |
| `/agents`             | `packages/mcp/README.md` (setup), the tools registered in `packages/mcp/src/server.ts`, and one real call and answer per tool, run against the server at build time      | `Agents.dc.html`                         |
| `/releases`           | `packages/perron/CHANGELOG.md`, `packages/mcp/CHANGELOG.md`                                                                                                              | none: the site's prose page              |

A slug is the spec file's name: `button` for `docs/components/button.md`. A registry entry whose spec page is missing gets no page and no link.

## Shared parts

Built once, in T1, and used by every page:

- **Root layout**: `perron.css`, `PerronProvider` with the `en` locale, the theme script, the header, the map, `<main>`, a footer with the licence and the repository link.
- **Theme**: dark by default; the switch sets `data-theme` on `<html>` and remembers the choice in `localStorage`, read by an inline script before first paint so nothing flashes.
- **`MapBackground`**: the live map of the mockups as one component, its geometry in one data file. Lines and land in `color.map.*` and `color.transit.line.*`, dots and line widths in the `map.*` and `vehicle-dot.*` tokens. Vehicles glide along their lines with SVG `animateMotion`, metros wait at stations, a new report pulses once (`duration.report-pulse`); under `prefers-reduced-motion` a still group shows each vehicle at its last report instead, and a vehicle with no signal never moves. Props choose the view (the home's full map, a page's quieter strip) without forking the drawing.
- **`SiteHeader`**: the glass pill, `Brand` with `brandNameLabel="Perron"` linking home, the six section links with `aria-current` on the active section, the search button, the theme switch and the GitHub link. It renders `SiteMenu` and `SiteSearch` from their own files (stubs in T1, built in T8).
- **`PageHeader`**: a page's title (`.pn-title`: `typography.display`, `typography.heading-lg` under `breakpoint.phone`), its lead (`typography.lead`) and an optional overline and actions.
- **`Markdown`**: renders a doc's markdown with every element in a type role, `.md` links rewritten to site routes (or to the repository for files the site has no page for), code in the data family.
- **Site CSS**: the mockups' helpers as site classes (`glass`, `hover`, `lift`, `link`, `scroll-x`, `title`, `moving`/`still`), in `website/app/site.css`.
- **Loaders** in `website/lib/`: `repo.ts` (the repo root), `registry.ts` (entries with slug, spec path, status, description from the spec's first paragraph), `foundations.ts` (`readPages()` output, by slug), `api.ts` (props by component), `tokens.ts`, `changelog.ts` (versions and entries), `markdown.ts` (sections of a doc by heading). Each has a unit test in the root Vitest `unit` project.
- **Previews registry**: `website/previews/index.ts` exports `getPreview(name, props?)`, joining `components.tsx` (T5) and `patterns.tsx` (T6). T1 leaves both empty, so every page can import the registry from the start.

## Tickets

Order: T0, then T1 and T2 together, then T3 to T8 (with T5 split in two) in parallel once T1 is merged into the branch, then T9, then T10.

### T0. Settle the open items and write this plan

**What to build:** ADR 0011, the roadmap's 9.1 line, `website/README.md`'s open items pointing at the ADR, and this plan.

**Owns:** `docs/adr/0011-website-before-the-build.md`, `ROADMAP.md` (line 9.1), `website/README.md`, `website/PLAN.md`.

**Acceptance criteria:**

- [x] Each of the four items has one decision, in the ADR.
- [x] Every ticket below names the files it owns.

**Blocked by:** None.

### T1. Shell

**What to build:** `npm run dev -w website` serves an empty page with the glass header over the moving map, in dark by default, switching to light and back; every route of the table above exists as a placeholder that renders its title through `PageHeader`; the loaders return the repo's data.

**Owns:** `website/package.json`, `website/next.config.ts`, `website/tsconfig.json`, `website/next-env.d.ts`, `website/.gitignore`, `website/app/layout.tsx`, `website/app/site.css`, `website/app/not-found.tsx`, `website/components/site/*` (except `SiteMenu.tsx`, `SiteSearch.tsx` after T1), `website/components/map/*`, `website/lib/*` (the loaders listed above and their tests), `website/previews/index.ts`, placeholder `page.tsx` for every route (each handed to its page ticket once T1 merges), the root `package.json` (workspace, `check`), `vitest.config.ts`, `tsconfig.json` and lint or format config where the site needs an entry, `.github/workflows/ci.yml` if the build needs a step.

**Acceptance criteria:**

- [ ] `npm run build -w website` passes and is part of `npm run check`; `npm run check` passes.
- [ ] The map's vehicles glide, and jump between reports under `prefers-reduced-motion` (checked with Playwright's `reducedMotion`); no-signal vehicles never move.
- [ ] The theme switch works without a flash on reload, and the choice survives a reload.
- [ ] Every loader has a unit test against the real repo files.

**Blocked by:** T0.

### T2. Lead text role

**What to build:** `typography.lead` through the `design-tokens` skill, documented on the Typography page, with a changeset for `@mylder/perron`.

**Owns:** `packages/perron/tokens/base.tokens.json`, the generated token files and data, `docs/foundations/typography.md` (prose and marker), `docs/foundations/README.md` (the role count), `.changeset/typography-lead.md`.

**Acceptance criteria:**

- [ ] `var(--perron-typography-lead)` and the `perron-typography-lead` class exist after `npm run tokens`.
- [ ] `npm run check` passes.

**Blocked by:** T0.

### T3. Home

**What to build:** the home page of `Home.dc.html`: the hero over the full map (overline with the package version, title, lead, the counts from the registry and tokens, Get started as the one brand-yellow action, Browse components, the MCP command with a copy button), the columns of live components in glass panels, and "What the system is made of". Under `breakpoint.phone` it follows `Phone-Home.dc.html`.

**Owns:** `website/app/page.tsx`, `website/app/(home)/*`, `website/components/home/*`.

**Acceptance criteria:**

- [ ] Every number on the page comes from a loader.
- [ ] Every component in the columns is the real one from `@mylder/perron` or `@mylder/perron/patterns`; a designing component is not drawn.
- [ ] The columns stand still; only the map's vehicles move.

**Blocked by:** T1.

### T4. Foundations

**What to build:** the index of `Foundations.dc.html` (one tile per foundation page, each drawn from its tokens; the "Only on a live map" group; "Using the tokens") and a page per foundation, with Content design among them. Each page's table blocks are drawn from `readPages()`'s rows as swatches, specimens and galleries, never as copied tables.

**Owns:** `website/app/foundations/**`, `website/components/foundations/*`.

**Acceptance criteria:**

- [ ] Every foundation page in `PAGES` and Content design has a route, generated by `generateStaticParams`.
- [ ] A token value on any page comes from the data, and a colour swatch paints with its `var(--perron-*)`.

**Blocked by:** T1.

### T5a. Components index and previews

**What to build:** the index of `Components.dc.html`: every stable component as a card holding the component, grouped by category, the designing ones marked as in design. Behind it, a preview for every stable component in the previews registry: `componentPreviews[name](props)` draws the component with `props` spread onto it and the content its spec's examples use, so a spec page can ask for any variant, colour, size or state.

**Owns:** `website/app/components/page.tsx`, `website/components/catalogue/*`, `website/previews/components.tsx` and any client preview files under `website/previews/components/`.

**Acceptance criteria:**

- [ ] Every stable component has a card with its preview, and every preview is the shipped component.
- [ ] `getPreview('Button', { variant: 'outline', size: 'small' })` draws an outline small Button.

**Blocked by:** T1.

### T5b. Spec pages

**What to build:** the spec page of `Button.dc.html` for every component and pattern: in context on the map with a glass sheet, variants × states, sizes, with icons, props from `api.json`, and the install strip with the `get_reference` call. Button is the reference page; other entries take the sections their props support, and draw each cell through `getPreview`. Hover, pressed and focus cells use the component's own CSS rules, applied by the site from the component's stylesheet, never hand-copied values. Under `breakpoint.phone` the page follows `Phone-Button.dc.html`.

**Owns:** `website/app/components/[slug]/**`, `website/app/patterns/[slug]/**`, `website/components/spec/*`, `website/lib/spec.ts` and its test.

**Acceptance criteria:**

- [ ] Every registry entry with a spec page has a page; a designing entry's page says it is in design and draws no preview.
- [ ] The props table matches `api.json` for Button, row for row.

**Blocked by:** T1.

### T6. Patterns

**What to build:** the patterns index of `Patterns.dc.html`: the map screen with each stable pattern in its place, a card per stable pattern, the patterns in design, and "Use a pattern". The pattern previews, with Mylder-like sample data in the content-design voice.

**Owns:** `website/app/patterns/page.tsx`, `website/components/patterns/*`, `website/previews/patterns.tsx`.

**Acceptance criteria:**

- [ ] Each preview is the pattern from `@mylder/perron/patterns`.
- [ ] Sample data follows `docs/content-design.md`: 24-hour clock, "−1 min" with the true minus, "~" before estimated times.

**Blocked by:** T1.

### T7. Agents, Get started and Release log

**What to build:** `/agents` from `Agents.dc.html`: the setup from `packages/mcp/README.md`, then each tool the server registers with its description and one real call and answer, made against the server through the MCP SDK's in-memory transport at build time; "Where the answers come from". `/get-started` and `/releases` as prose pages from their files.

**Owns:** `website/app/agents/**`, `website/app/get-started/**`, `website/app/releases/**`, `website/components/agents/*`, `website/lib/mcp.ts` and its test.

**Acceptance criteria:**

- [ ] The tool list is read from the server, so a new tool shows without a site change.
- [ ] Each answer shown is the server's output for the call shown.

**Blocked by:** T1.

### T8. Navigation and phone

**What to build:** the phone menu as a bottom sheet (Perron's `Sheet`) from the header's menu button, the docs search (Perron's `Dialog` and `SearchField`, over an index of every page's title and headings built at build time, opened by `/` and the header button), and the phone rules every page shares: the compact header, panels full of text opaque under `breakpoint.phone`, and no horizontal scroll at 375 px.

**Owns:** `website/components/site/SiteMenu.tsx`, `website/components/site/SiteSearch.tsx`, `website/lib/search-index.ts` and its test, `website/app/phone.css`.

**Acceptance criteria:**

- [ ] The menu and search work with the keyboard alone, return focus on close, and show the focus ring.
- [ ] At 375 px wide, every route has no horizontal scroll and no text over the moving map.

**Blocked by:** T1.

### T9. Review

**What to build:** a fresh reviewer reads the diff against `main`, the mockups and the rules in `website/README.md`, and reports what differs.

**Owns:** nothing; it reads.

**Blocked by:** T3, T4, T5a, T5b, T6, T7, T8.

### T10. Fix, screenshot and ship

**What to build:** the reviewer's findings fixed or answered, a screenshot of each route in dark, light and phone, and the PR.

**Acceptance criteria:**

- [ ] `npm run check` passes, with the site build in it.
- [ ] The screenshots are attached to the PR body.

**Blocked by:** T9.
