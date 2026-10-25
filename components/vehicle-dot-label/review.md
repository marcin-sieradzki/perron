# Review: VehicleDotLabel, round 1

## P1

None.

## P2

- **P2-1.** `docs/components/vehicle-dot-label.md:133` CR-5 gives the `label` `min-inline-size: 0` in a `1fr` column (`packages/perron/src/components/VehicleDotLabel/VehicleDotLabel.css:40`, Tokens row at spec line 85). That makes the label's min-content the dot alone, measured at 17 px. It undoes the reason the contract's CSS Long words rule gives for choosing `overflow-wrap: break-word`: "break-word keeps whole words at its narrowest". In an auto-layout table cell beside longer text, the default "Timetable only" renders letter by letter as "Ti / me / tab / le / onl / y" at 21 px wide, and two labels in a 150 px row that doesn't wrap squeeze their word to 54 px each. A layout like Tag's keeps whole words in both places and still breaks a compound inside a 120 px container (checked in Chromium): an `inline-block` root with `max-inline-size: 100%`, an inline-start padding of `icon.size.325` plus `space.100`, and the dot placed at `calc((1lh - icon.size.325) / 2)`. The contract holds, so CR-5, the Tokens rows at spec lines 77 and 85, and the CSS comment at `VehicleDotLabel.css:14-15` should be rewritten to match. That comment says "a row of labels keeps whole words at its narrowest", which is true only of a row that wraps.
- **P2-2.** `docs/components/vehicle-dot-label.md:41` "SeverityLabel takes none either: the five words stay those of Content design on every screen…" puts VehicleDotLabel's reason after SeverityLabel's name, so it reads as though the five data-state words were SeverityLabel's, which has four other words. The content-audit Docs step asks for plain, short sentences. Suggested: "As SeverityLabel takes none: the five words stay content design's on every screen, and a time beside the label is the caller's own text…".

## P3

- **P3-1.** `packages/perron/src/components/VehicleDotLabel/VehicleDotLabel.tsx:58` The `className` JSDoc and its spec row (`docs/components/vehicle-dot-label.md:57`) read "Merged after `pn-VehicleDotLabel` on the root". The contract's Props table words it "Reaches the root", and most siblings with a merge note write "Reaches the root. `className` is merged after `pn-<Name>`.". VehicleDot, the one entry in `dependsOn`, uses the same form as this component, so the family agrees but the library doesn't. The maintainer may want one form across the library (api-consistency, JSDoc rule).
