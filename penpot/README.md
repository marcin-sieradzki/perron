# Penpot

Every component is designed in Penpot before it is built, and the design owns its anatomy and variants while `packages/perron/tokens/` owns the values ([ADR 0002](../docs/adr/0002-penpot-owns-anatomy-repo-owns-values.md)). This folder holds what the agents need to work in Penpot: the helpers, the drawing conventions, each design read back as data, and what the plugin API can do.

Design work runs in the one library file, "Perron Design System", through the Penpot MCP's `execute_code`, and only while the maintainer has that file open with File → MCP Server → Connect, its tab in front.

## Session start

Before anything else in a Penpot session, pass the whole of [`helpers.js`](helpers.js) as the code of one `execute_code` call. It installs, in the MCP's `storage`:

- `storage.bind(shape, property, tokenName)` binds a token to a Penpot token property (`fill`, `strokeColor`, `strokeWidth`, `paddingLeft`, …), or to every side at once with `padding`, `radius` or `gap`. It throws on a token that doesn't exist.
- `await storage.readBack(container)` reads a component, from its variant container or the main instance of a component without variants, into the format below. It hashes exports with `storage.sha256`.

`storage` lasts until the tab reloads or reconnects; if `storage.bind` is missing, load the file again.

## Conventions

- **One page per component or pattern**, named `Components/<Name>` or `Patterns/<Name>`.
- **Variant properties are React props.** Each property's name and values are the prop's name and values, such as `variant` with `solid` and `outline`.
- **Layers are parts.** Each layer is named for the part it becomes: `root`, `label`, `startIcon`. Penpot names a main instance after its component; the read-back writes it as `root`.
- **Interaction states are a `State` property**, with values such as `default`, `hover`, `focus` and `disabled`, mapped to CSS states in the code map.
- **Every value is a token.** Bind each fill, stroke, radius, padding and gap with `storage.bind`; a literal value fails the check. A zero radius, padding or gap needs no token.

## Read-back

Each design is read back into two files, so the build and review agents compare code with data rather than pictures, and the checks run without Penpot.

`penpot/<name>.json` is what `storage.readBack` returns, written with `JSON.stringify(result, null, 2)`: the component, its page, the file and container ids, each variant property with its values, and for each variant its component id, its property values, a SHA-256 of its PNG and SVG exports, and its layer tree with each layer's size, layout, fills, strokes, radius and bound tokens. The SVG is hashed with its ids blanked, since every export carries fresh ones, so both hashes change only when the drawing does. The types are `ReadBack` and `Layer` in [`scripts/checks/penpot.ts`](../scripts/checks/penpot.ts).

`penpot/<name>.code-map.json` is written by hand, and says where each property and layer lands in code:

```json
{
  "component": "Button",
  "properties": {
    "variant": { "prop": "variant", "values": { "solid": "solid", "outline": "outline" } },
    "State": { "state": { "default": null, "hover": ":hover", "disabled": "[data-disabled]" } }
  },
  "layers": { "root": "root", "label": "label", "startIcon": "startIcon" }
}
```

The `penpot` rule of `npm run check` fails when a design binds a token name that isn't in `packages/perron/tokens/`, leaves a fill, stroke, radius, padding or gap unbound, or has a variant value or layer name its code map doesn't map. It also fails a code map for another component, and a `State` mapped to a prop.

## What the plugin API can do

Smoke-tested on design.penpot.app on 2026-10-24 (ROADMAP 3.1), on a scratch page of the library file. Each of the four features the loop depends on works.

| Feature                         | Works | How                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bind tokens and read them back  | Yes   | `shape.applyToken(token, ['fill'])`, with `paddingLeft`…`paddingBottom`, `borderRadiusTopLeft`…`borderRadiusBottomLeft`, and `rowGap` and `columnGap` for padding, radius and gap. `shape.tokens` then reads `{ fill: 'color.text.primary', paddingTop: 'space.200', … }` and the shape holds the resolved values. |
| Build a variant container       | Yes   | `penpotUtils.createVariantContainer([{ shape, properties: { variant: 'solid', State: 'default' } }, …])` from main instances. Property names keep their case, and each variant keeps its bound tokens.                                                                                                             |
| Export PNG and SVG              | Yes   | `await shape.export({ type: 'png' })` and `{ type: 'svg' }` both return a `Uint8Array`, of a board or a whole variant container. `btoa` over the bytes gives base64.                                                                                                                                               |
| Switch the token theme and back | Yes   | `theme.toggleActive()` on the `Dark` theme turns `Light` off, swaps the `light` set for `dark` and re-resolves bound fills (`color.text.primary` went from `#12181b` to `#ebeeeb`); toggling `Light` restores it.                                                                                                  |

## Quirks and workarounds

- **Pages switch asynchronously.** `penpot.openPage(page)` returns before the page is active, and changing a shape on it throws `Cannot modify a page that is not currently active`. Wait until `penpot.currentPage.id === page.id` (about a second) before drawing.
- **New shapes land on the current page.** `penpot.createBoard()` and friends add to whichever page is active, so open the target page first.
- **Token binding is asynchronous.** Read `shape.tokens` and the bound values after a short wait; 500 ms is enough.
- **Binding a stroke token adds a stroke.** `strokeColor` on a shape with no strokes gives it a 1 px stroke in that colour; bind `strokeWidth` too, or the width is a literal.
- **Translucent tokens split into colour and opacity.** A token such as `rgba(18, 24, 27, 0.05)` reads back as `fillColor: '#12181b'` with `fillOpacity: 0.05`, and its `resolvedValue` drops the alpha. The read-back writes it as `#12181b0d`.
- **Colours read back in lowercase.** A bound fill reads `#12181b` while the token's `resolvedValue` is `#12181B`; compare case-insensitively.
- **SVG exports differ every time.** Each one carries fresh render ids; `readBack` blanks them before hashing.
- **The sandbox has no `TextDecoder` and no `crypto`.** Decode an SVG export's bytes with `String.fromCharCode` over the array, and hash in plain JavaScript, as `storage.sha256` does.
