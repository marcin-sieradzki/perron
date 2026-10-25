# The website's lead text, navigation, wordmark and sections

The website of ROADMAP 9.1 is a Next.js app in the `website/` workspace, built from the mockups in `website/mockups/`. Four things were open before its build; this record settles them.

1. **Lead text is a typography role.** `typography.lead` joins the base tokens: the body family, regular weight, `font.size.400` (16 px) and the normal line height. It sets the paragraph under a page title, on the website and on any long-form screen Mylder grows. `typography.body` stays at 14 px for sentences and inputs, so a page intro no longer has to borrow a heading role or a raw size. It ships in `@mylder/perron` like every role, through the `design-tokens` skill.
2. **The navigation is site-only.** The header's section links, the theme switch, the docs search and the phone menu are components of `website/`, not of `@mylder/perron`. They are built from Perron's components where one fits (`Sheet` for the phone menu, `Dialog` and `SearchField` for search, `IconButton` for the switch), with the site's own layout around them. Mylder has no top navigation of its own, so a nav component in the package would be designed for one caller; if Mylder ever needs one, it goes through the factory like any component.
3. **The wordmark is Brand with another name.** The header renders `Brand` with `brandNameLabel="Perron"`: the Mylder mark beside the name, set lowercase like "mylder", and read as "Perron" by screen readers. Perron is Mylder's system, so it keeps Mylder's mark, and the site needs no lockup of its own.
4. **The sections are Get started, Foundations, Components, Patterns, Agents and Release log.** Content design is a foundation page, beside colour and type, so it needs no section. Agents holds the MCP server now and the consumer skill and blueprints when phase 8 ships them; a Skills section today would list the skills that build Perron, which a consumer never runs. The header lists the six in that order, and the home page's main action is Get started. It is a link, and `LinkButton` has no brand colour ("brand is never a link" in its spec), so it stays a neutral `LinkButton` until the package offers a brand link through the factory; the site never restyles a package class to make it yellow.

## Considered options

- **Use `body` for the intro.** Rejected: at 14 px a page's opening paragraph reads as small print beside a 48 px title, and the mockups' intros are the longest text set in `body`.
- **A `Nav` component in the package.** Rejected for now: one caller, and its design would be a website's, not Mylder's.
- **A site-only "Perron" lockup.** Rejected: Brand already takes another name, and a second lockup would draw the mark twice.
- **The mockups' four sections plus Content.** Rejected: a newcomer needs a Get started page, and a Release log is where a consumer learns what changed.

## Consequences

The website reads `docs/`, `packages/perron/components.json`, `packages/perron/api.json`, the package's `data/` and the two changelogs at build time, and draws every component preview with the component from `@mylder/perron` or `@mylder/perron/patterns`. Its background map is an illustration in the map tokens whose vehicles move along SVG paths; the data states beside it on the pages draw the real `VehicleDot`. The website was designed on a canvas outside Penpot; if its pages join the Penpot library, that starts from `penpot/README.md`. Hosting the site, and serving the MCP over HTTP from it, are ROADMAP 9.2.
