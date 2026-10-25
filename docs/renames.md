# Renames

Token names that changed or went away, newest first, so code written against an older name can follow. The components on Mylder's `perron/components` branch use the names before 23 October 2026.

## 25 October 2026: the vehicle dot

- **Components.** `Prik`, `PrikLabel` and `PrikLegend` are now `VehicleDot`, `VehicleDotLabel` and `VehicleDotLegend`.
- **Tokens.** The `prik.*` group is now `vehicle-dot.*`, and the CSS custom properties `--perron-prik-*` are now `--perron-vehicle-dot-*`. Only the group name changed: each token keeps its name and value (`prik.live-threshold` is `vehicle-dot.live-threshold`).

## 24 October 2026: the package

- **Package name.** Perron installs as `@mylder/perron`. Each import keeps its path after the name: `@mylder/perron/perron.css`, `@mylder/perron/tokens.ts`, `@mylder/perron/icons/plus.svg`. No token name changed.
- **Folders.** In this repository the tokens, styles, icons and logos moved from the root into `packages/perron/`.

## 23 October 2026: borders, focus and reduced motion

- **Control edges.** Inputs and outline buttons move from `color.border.strong` to the new `color.border.control`, which reaches 3:1 on every surface. `color.border.strong` stays for lines that decorate, such as dashed tags and chart axes.
- **New tokens for literals.** A 1 px border reads `border.width.025`, a 2 px one `border.width.050`. The focus ring reads `focus.width` and `focus.offset`. The smallest target is `size.target-min`.
- **Thumb shadow.** `shadow.thumb` moved from base into the themes, stronger in dark. The name is unchanged.
- **Dark inset.** `palette.neutral.700` changed from #20282C to #283237, so dark `color.surface.inset` stands apart from `color.surface.raised`.
- **Reduced motion.** `tokens.css` sets the transition durations to 0.01 ms under `prefers-reduced-motion: reduce`. A component's own override of those durations can go; its code that stops loops stays.
- **Icon sizes.** An icon's size reads `icon.size.325` (13 px), `icon.size.400` (16 px) or `icon.size.450` (18 px). The icon SVGs and the mark now live in this repository, in `icons/` and `logos/`.
- **Docs.** `docs/foundations.md` became one page per foundation in `docs/foundations/`. Its content section is now `docs/content-design.md`. <!-- perron-allow(paths): the page before the split, named so old links can be followed -->

## 23 October 2026: palette, status colours and one type set

### Typography roles

| Before                                                           | Now          |
| ---------------------------------------------------------------- | ------------ |
| `display-lg`                                                     | `heading-lg` |
| `display-sm`, `wordmark` (set it bold)                           | `heading-md` |
| `title`                                                          | `heading-sm` |
| `body`, `prose`                                                  | `body`       |
| `body-sm`, `meta`                                                | `body-sm`    |
| `caption`, `secondary`, `fine`, `attribution`                    | `caption`    |
| `label`, `control`, `list-title`, `action`                       | `label`      |
| `label-sm`, `tooltip`, `icon-label`, `stat-label`, `field-label` | `label-sm`   |
| `overline`, `overline-sm`, `tag`, `tag-sm`                       | `overline`   |
| `badge`, `badge-lg`                                              | `badge`      |
| `stat`, `stat-lg`                                                | `stat`       |
| `data-display`                                                   | `data-xl`    |
| `clock`, `countdown`                                             | `data-lg`    |
| `data`, `data-md`, `data-control`, `data-sm` (11.5 px)           | `data`       |
| `data-xs`, `data-fine`, `data-2xs`, `data-axis`                  | `data-sm`    |

`display` is new, for the hero page.

### Font sizes

| Before (px)       | Now              |
| ----------------- | ---------------- |
| 9.5, 10, 10.5, 11 | `font.size.275`  |
| 11.5, 12, 12.5    | `font.size.300`  |
| 13, 13.5          | `font.size.325`  |
| 14, 14.5          | `font.size.350`  |
| 15                | `font.size.400`  |
| 20, 22            | `font.size.500`  |
| 23, 26            | `font.size.600`  |
| 27, 30            | `font.size.700`  |
| 40                | `font.size.800`  |
| 54                | `font.size.1200` |

Line heights are tokens now: `font.line-height.none`, `tight`, `snug` and `normal`.

### Colour

- New: the `palette` tier; `color.text.success`, `warning`, `danger`, `info` and `brand`; `color.surface.success`, `warning`, `danger`, `info`, `brand` and `brand-subtle`.
- `color.transit.delay.*` and `color.transit.severity.*` point at the status text colours, so they read at 4.5:1. Names unchanged.
- Merged into palette steps, so a few values moved slightly: dark `text.primary` #E8EDEB → #EBEEEB, dark `text.tertiary` #717E84 → #74818A, dark `surface.default` #14191C → #12181B, dark `surface.overlay` from #141A1D to #12181B (alpha unchanged), `text.on-color.dark` #14181A → #12181B.

### Removed

- `opacity.selected`: nothing read it.
- `opacity.warning-tint`: a warning count's background is `color.surface.warning`.
- The Familjen Grotesk 500 and JetBrains Mono 400 fonts: no role uses them.
