# Rendering stories and screens

How the audit skills render what they judge: every story of a component or pattern, or a screen, in both themes, with Playwright and the Chromium the story tests use.

## Serve it

- **Stories:** start `npm run storybook` in the background, on the port `STORYBOOK_PORT` names (6006 when it is unset; a factory batch gives each worktree its own), and wait until `http://localhost:<port>/index.json` answers. Its `entries` of `type: "story"` give each story's `id` and `title`: `Components/<Name>` or `Patterns/<Name>`. A story renders alone at `http://localhost:<port>/iframe.html?id=<story-id>&viewMode=story`.
- **A screen:** the URL its app's dev server gives, such as a Mylder screen. Render it at each breakpoint in `docs/foundations/layout.md` and at 320 px wide.

Stop the server when the audit is done.

## Themes and tokens

Set `data-theme` on `<html>` after the page loads: `dark` for dark, and `light` for light, so the system's preference never decides. Any ancestor works, which is how a dark panel nests in a light page.

Before judging anything, read `--perron-color-text-primary` from `<html>`'s computed style. Empty means the page has no tokens: everything after it would judge browser defaults. Report it as one Defect, that the page does not load `@mylder/perron/perron.css` (for stories, `.storybook/preview.ts` is where it belongs), and stop.

## The script

Save it in your scratchpad and run it from the repo root, so `playwright` resolves from the repo's `node_modules`:

`node --input-type=module - <out-dir> <title-prefix> < <script>`

```js
import { chromium } from 'playwright'

const [out, prefix] = process.argv.slice(2)
const base = `http://localhost:${process.env.STORYBOOK_PORT ?? 6006}`
const index = await (await fetch(`${base}/index.json`)).json()
const stories = Object.values(index.entries).filter(
  (e) => e.type === 'story' && e.title.startsWith(prefix),
)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
for (const story of stories)
  for (const theme of ['light', 'dark']) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`)
    await page.waitForLoadState('networkidle')
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme)
    const tokens = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--perron-color-text-primary'),
    )
    await page.screenshot({ path: `${out}/${story.id}.${theme}.png`, fullPage: true })
    console.log(story.id, theme, tokens ? 'tokens' : 'NO TOKENS')
    console.log(await page.locator('#storybook-root').ariaSnapshot({ boxes: true }))
  }
await browser.close()
```

Look at each PNG with the Read tool. Extend the loop for what the audit measures:

| To get                         | Use                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| A value as it renders          | `page.evaluate` over `getComputedStyle(element)`: colours, lengths, fonts                            |
| A box                          | `locator.boundingBox()`, or `ariaSnapshot({ boxes: true })` for every node at once                   |
| Hover, focus, pressed          | `locator.hover()`, `page.keyboard.press('Tab')`, `page.mouse.down()`                                 |
| The accessibility tree         | `locator.ariaSnapshot()`: roles, names and states; it leaves out what `aria-hidden` and `inert` hide |
| Reduced motion, forced colours | `page.emulateMedia({ reducedMotion: 'reduce' })`, `page.emulateMedia({ forcedColors: 'active' })`    |
| A narrow screen                | `page.setViewportSize({ width: 320, height: 640 })`                                                  |
