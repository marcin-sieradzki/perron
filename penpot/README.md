# Penpot

Every component is designed in Penpot before it is built, and the design owns its anatomy and variants while `packages/perron/tokens/` owns the values ([ADR 0002](../docs/adr/0002-penpot-owns-anatomy-repo-owns-values.md)). This folder holds what the agents need to work in Penpot: what the plugin API can do, and the workarounds where it can't.

Design work runs in the one library file, "Perron Design System", through the Penpot MCP's `execute_code`, and only while the maintainer has that file open with File → MCP Server → Connect, its tab in front.

## What the plugin API can do

Smoke-tested on design.penpot.app on 2026-10-24 (ROADMAP 3.1), on a scratch page of the library file. Each of the four features the loop depends on works.

| Feature                         | Works | How                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bind tokens and read them back  | Yes   | `shape.applyToken(token, ['fill'])`, with `paddingLeft`…`paddingBottom` and `borderRadiusTopLeft`…`borderRadiusBottomLeft` for padding and radius. After about 500 ms, `shape.tokens` reads `{ fill: 'color.text.primary', paddingTop: 'space.200', … }` and the shape holds the resolved values. |
| Build a variant container       | Yes   | `penpotUtils.createVariantContainer([{ shape, properties: { variant: 'solid', State: 'default' } }, …])` from main instances. Property names keep their case, and each variant keeps its bound tokens.                                                                                            |
| Export PNG and SVG              | Yes   | `await shape.export({ type: 'png' })` and `{ type: 'svg' }` both return a `Uint8Array`, of a board or a whole variant container. `btoa` over the bytes gives base64.                                                                                                                              |
| Switch the token theme and back | Yes   | `theme.toggleActive()` on the `Dark` theme turns `Light` off, swaps the `light` set for `dark` and re-resolves bound fills (`color.text.primary` went from `#12181b` to `#ebeeeb`); toggling `Light` restores it.                                                                                 |

## Quirks and workarounds

- **Pages switch asynchronously.** `penpot.openPage(page)` returns before the page is active, and changing a shape on it throws `Cannot modify a page that is not currently active`. Wait until `penpot.currentPage.id === page.id` (about a second) before drawing.
- **New shapes land on the current page.** `penpot.createBoard()` and friends add to whichever page is active, so open the target page first.
- **Token binding is asynchronous.** Read `shape.tokens` and the bound values after a short wait (500 ms is enough), never in the same tick as `applyToken`.
- **Colours read back in lowercase.** A bound fill reads `#12181b` while the token's `resolvedValue` is `#12181B`; compare case-insensitively.
- **The sandbox has no `TextDecoder` and no `crypto`.** Decode an SVG export's bytes with `String.fromCharCode` over the array, and hash in plain JavaScript.
- **A main instance is named after its component.** Turning a board named `root` into a component renames it to the component's name.
