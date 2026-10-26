# @mylder/perron

## 0.6.0

### Minor Changes

- 7d84b46: `DepartureRow` gains the optional `expected` prop, the time real-time data expects the departure to leave, `HH:MM`, as `StopTimeline`'s stops take it. For a `live`, `ageing` or `estimated` row it shows in the timetabled time's place, after a "~" when `estimated`, with the timetabled `time` struck through before it when the two differ, "~~08:14~~ 08:16", heard as "Timetabled 08:14" and then the time; a `timetable-only`, `no-signal` or cancelled row, or one with an `interval`, shows `time` as before. New `slotProps.expected` and the label prop `timetabledTimeLabel`. Adds the owned string `timetabledTime` to every locale; a caller that supplies its own dictionaries adds it too.
- 9873522: `MapControls` takes an optional pause button for the map's motion: given `onPausedChange(event, paused)`, the bar adds it after the centre button, past a second separator, in the same bar and arrow-key order, so the map's controls stay one tab stop. The screen holds `paused` (default `false`); the button shows the `pause` icon and is named "Pause" while the map moves, and the `play` icon and "Resume" while it is paused, with no `aria-pressed`. New owned strings `pause` and `resume`, in all four locales (a caller that supplies its own dictionaries adds them too), overridden by the new `pauseLabel` and `resumeLabel` props. Without `onPausedChange` the bar renders as before.
- 7d84b46: `SourceLine`'s sources can say what each time is of, in the app's own words: a source's new `label` is a template with a `{time}` placeholder, such as `'position {time}'`, shown in place of "updated {time}", and `dateTime` gives the `<time>` element a machine-readable value for a time written as a date, such as `'12 October'`. `name` and `time` are now optional, so one provider's name can stand before two facts, "Rejseplanen · position 08:14:05 · times 08:14:20", and a fact can have no time, "times from the timetable". A labelled source whose `outOfDate` is set adds "may be out of date" after its label, through the new owned string `sourceLabelOutOfDate`, "{label}, may be out of date", overridden by the new `sourceLabelOutOfDateLabel` prop. Lines without a `label` render as before.
- 9873522: `TopBar`'s `size` takes `'responsive'`: one render that is the phone's layout, `small`, under `breakpoint.phone` and the wide one, `medium`, above it, switched by a media query with no JavaScript, for a page rendered before it knows the viewport's width. The groups keep the wide order in the DOM at both widths, and on a phone CSS places the tools on the first row and the filters on the second, with `reading-flow: flex-visual` so that a browser that supports it tabs in the order on screen. `'medium'` and `'small'` render as before, and the default is still `'medium'`. No new owned strings.

  The `breakpoint` tokens' description now says what each one is, the width below which the screen changes, and how a media query writes it, `(max-width: 759.98px)` for `breakpoint.phone`'s 760 px; no value changes.

## 0.5.0

### Minor Changes

- 22f5566: Adds `map.strand.*`, one number per line (M1 to M4, A, B, C, E, F, H): its place from a shared track's centre, in steps of its mode's `map.track-spacing`, so an app draws lines that share a track side by side, in a fixed order, instead of on top of each other.
- 22f5566: Adds the `pause` and `play` icons to the Map set, on the 16 px grid at `icon.size.400`, for the map's control that stops the vehicles moving and sets them moving again.
- dfc0d48: Adds `TopBar`, and the owned strings `topBarUpdated`, `topBarUpdatedOutOfDate` and `topBarFilters`, in all four locales; a caller that supplies its own dictionaries adds them too.

## 0.4.0

### Minor Changes

- 3f4aa6a: Adds `selected` to `Button`, for a toggle such as "Follow": `true` or `false` sets `aria-pressed` and draws the button on (its colour's solid look) or off (its colour's outline look) in either variant, and `true` sets `data-selected`. Left out, the button is no toggle and has no `aria-pressed`. A toggle keeps its label the same off and on, "Follow", since `aria-pressed` says the state. No new owned strings.
- 87aa012: Adds `DataStateKey`, with its counts type `DataStateKeyCounts`, and the owned strings `liveDescription`, `ageingDescription`, `estimatedDescription`, `timetableOnlyDescription`, `noSignalDescription`, `secondsDuration` and `minutesDuration`, in all four locales; a caller that supplies its own dictionaries adds them too.
- 1767b0e: `DepartureRow` gains three optional props. `cancelled` keeps a departure that won't run in the list, "Cancelled" in place of the dot and the state's word, its countdown and time struck through and no delay, and sets `data-cancelled` on the root. `interval` takes the minutes between departures, one number or a `[fewest, most]` pair, for a line that runs to a headway such as the Metro, and shows "Every 3 min" or "Every 3 to 4 min" in place of the countdown, the time and the delay. `platform` shows the caller's platform or track label, "Track 4", after the state's word. `countdown` is now optional, since an interval row has none; left out, it shows "—". New `slotProps` keys `platform` and `interval`, and new label props `cancelledLabel`, `everyLabel` and `everyRangeLabel`. Adds the owned strings `cancelled`, `every` ("Every {minutes} min") and `everyRange` ("Every {from} to {to} min") to every locale, the last two templates each locale fills in its own word order, such as the Danish "Hvert 3. min"; a caller that supplies its own dictionaries adds them too.
- ccceaf6: Adds `stops`, `time` and `action` to `DisruptionCard`. `stops` takes a list of stop names, "Affects Nørreport, Kongens Nytorv and 3 more", or a stretch, `{ from, to }`, "Between Hellerup and Klampenborg". `time` takes `{ from, to }`, "From 08:03", "Until 22:00" or "24 to 25 October". `action` holds one link or button, such as "Show on map". It also adds a fifth `SeverityLabel` kind, `notice` ("Service notice"), for a message whose fields don't say which kind it is, with the `info-circle` icon, the `serviceNoticeLabel` prop and the token `color.transit.severity.notice`, which `DisruptionCard`'s `severity` takes too. New owned strings: `serviceNotice`, `affectsStops`, `stopListEnd`, `moreStops`, `betweenStops`, `fromTime`, `untilTime` and `timeRange`, the last seven with `{name}` placeholders, each with its `*Label` override on `DisruptionCard`.
- adb74b8: Adds `SourceLine`, with its source type `SourceLineSource`, and the owned strings `sourceUpdated`, `sourcePaused` and `sourceOutOfDate`, in all four locales; a caller that supplies its own dictionaries adds them too.
- 52a3b9f: `StopTimeline`'s stops gain two optional fields. `cancelled` keeps a call the vehicle won't make in the list, "Cancelled" under its name in the danger colour, its time and expected time struck through and no delay, and sets `data-cancelled` on its `<li>`, as `DepartureRow` marks a cancelled departure. `expected` takes the time real-time data expects at the stop, `HH:MM`, shown after the timetabled time as "~08:16" in a column of its own and heard as "Expected 08:16"; an empty one shows nothing. New label props `cancelledLabel` and `expectedTimeLabel`. Reuses the owned string `cancelled` and adds the owned string `expectedTime` ("Expected {time}"), a template each locale fills with the time, to every locale; a caller that supplies its own dictionaries adds it too.
- f217972: VehicleTable gains sortable headers, a hideable Delay column and an optional Last seen column. `sort` marks the order the caller has put `vehicles` in, with `aria-sort` and an arrow on that column's header alone, and `onSortChange(event, sort)` makes every header a button that asks the caller for a sort; the table still reorders no row. `delayColumnHidden` leaves the Delay column out, and `lastSeenColumnVisible` shows Last seen before it, from a new optional `lastSeen` time on each vehicle, with `lastSeenColumnLabel` and `unknownLabel` to override its words. The pattern now exports the types `VehicleTableSort` and `VehicleTableColumn`. Adds the owned string `lastSeenColumn` ("Last seen") and the `arrow-down` icon, under Controls.

### Patch Changes

- ae634c5: Data states now says a vehicle with no signal keeps moving on the timetable plus its last known delay from where it was last seen, its cut glyph, not its place, carrying the doubt, and that the live and ageing thresholds are each app's to set from its feed's interval between reports. `vehicle-dot.live-threshold` (60 s) and `vehicle-dot.ageing-threshold` (5 min) keep their values as documented defaults, and their descriptions, `color.data-state.no-signal`'s, the JSDoc of the `live`, `ageing` and `noSignal` owned strings and ReportStrip's `counts` fields no longer state "under a minute" or 5 minutes as fixed facts. The docs of VehicleDot, VehicleDotLabel, VehicleDotLegend, DepartureRow, ReportStrip, VehicleTable and Count point at the app's thresholds, and none says a silent vehicle is left where it was last seen.

## 0.3.0

### Minor Changes

- e4d4c2c: Adds `Accordion`, with `AccordionItem`, and their props types `AccordionProps` and `AccordionItemProps`. The `chevron-down` icon's use now names an accordion's panel too.
- a6ba2d9: Adds `AlertDialog`, and the token `size.dialog-width` (440 px), the widest it and Dialog get. Dialog now reads the token in place of its own 440 px, with no change to its width.
- 7dc5c92: Adds `Alert`, and the `info-circle` and `exclamation-circle` icons it shows for an info and a danger message, under a new Feedback category. The contract in the docs data now names `IntentIcon` among its shared parts and `drawing` among its shared helpers.

  The `CloseButton` part that Dialog, Popover, Sheet, SearchField and Alert share now sets its hover and pressed fills as `background-color` rather than `background`, with no visual change.

- 5f11855: Adds `Attribution`. The contract in the docs data now names `colour`, the story helper that reads a token's colour, among its shared helpers.
- 6f3e854: Yellow becomes Perron's primary colour. Adds `palette.yellow.600`, `color.surface.brand-hover` and `color.border.brand` for the brand button, and the brand guidance now names the main action as the brand colour's job.
- 6b89f39: Adds `Brand`. Adds the owned string `brandName` to every locale; a caller that supplies its own dictionaries adds it too.
- 8baffcb: Adds `Button`.
- 4807e9c: Adds `CheckboxGroup`, and `parent` to `Checkbox`, so a parent checkbox inside a group given `allValues` ticks or unticks the set.
- c036ef5: Adds `Checkbox`, and the `size.checkbox` token and the `tick` and `dash` icons it draws its box with.
- b9cc9e3: The contract in the docs data now lets components read `color.transit.*`, `color.data-state.*` and `vehicle-dot.*`, for Mylder's vocabulary of line badges, delays and vehicle dots.
- 2095d0b: Adds `Count`.
- ac6e681: Adds `DataStatePanel`. Adds the owned strings `noData` and `loadFailed` to every locale; a caller that supplies its own dictionaries adds them too.
- 2f9442b: Adds `DayProfileChart`. `border.width.050`'s description now names the line of a chart beside the focus ring and a control's selected state.
- 2137886: Adds `Delay`.
- 189daf7: Adds `DepartureRow`. Adds the owned string `now` to every locale; a caller that supplies its own dictionaries adds it too.
- b847d7e: Adds `DetailHeader`.
- 53e6abf: Adds `DetailPanel`. Sheet's `title` description now says how a pattern with a header of its own, DetailPanel, passes that header as `title`. DetailHeader's `action` description no longer offers it the panel's close button, which DetailPanel draws from the Sheet after the header. The contract in the docs data lists `withClass`, the shared helper that joins a Base UI part's class with the caller's, which Sheet, Dialog, MapTooltip and DetailPanel now import from one file.

  The contract in the docs data also lists `closed` and `byTestId`, two story helpers Sheet, Dialog and DetailPanel now import from one file.

- 44a438e: Adds `Dialog`.
- 81f30fd: Adds `DisruptionCard`. Adds the owned string `affectedLines` to every locale; a caller that supplies its own dictionaries adds it too.
- 2d0db45: Adds `EmptyState`.
- 4411634: Adds `FactList`.
- 5081dbe: Adds `Field`. Adds the owned string `optional` to every locale; a caller that supplies its own dictionaries adds it too. The contract's Shared helpers table names the story helper `lines`.
- 0370fb4: Adds `Fieldset`.
- efff9a4: Adds `FilterChip`.
- 7fb2059: Adds `HighlightChip`.
- 186776e: Adds `IconButton`.
- a88704f: Adds `Kbd`.
- 31230b3: Adds `KioskBar`.
- 60fba34: Adds `LineBadge`.
- 0fa05d9: Adds `LinkButton`.
- 44c5bf4: Adds `Link`. The contract in the docs data now names three story helpers among its shared helpers: `RouterLink`, which stands in for a router's link component, and `expectFollows` and `expectFocusRing`, the keyboard and focus-ring checks Link and LinkButton share.
- ff94dd3: Adds `MapControls`.
- cc8abfd: Adds `MapTooltip`.
- bcae0a6: Adds `Menu`, with `MenuItem`, `MenuLinkItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuGroup`, `MenuSeparator` and `MenuSubmenu`, and the `chevron-right` icon.
- dc849f3: Adds `Meter`, and the token `size.meter-track`, the height of its track. It adds no owned string key: an unknown value says the `unknown` string Stat, FactList and Count already have.
- 6ce5385: Adds `NormalService`, and the `check-circle` icon it shows for a line running normally.
- d3b3fe7: Adds `NumberField`, and the owned strings `increase`, `decrease` and `numberField`, in all four locales. The `plus` and `minus` icons' uses in `icons.json` now name the number field's steps too.
- 69f1a33: Every interactive component answers the pointer: IconButton, ToolbarButton, FilterChip, HighlightChip, SegmentedControl, Tabs, Switch, Checkbox, RadioGroup and DisruptionCard's link press a step past their hover look, and IconButton, ToolbarButton, FilterChip, HighlightChip, LinkButton and a linked DisruptionCard take the pointer cursor (default while disabled). The selected tab no longer shows a hover or press, as a press does not change it. A new `pointer-feedback` gate fails a hover with no pressed look past it, or a hovered part with no pointer.
- 0af6b9a: Button and LinkButton answer the pointer: a pointer cursor on Button (default while disabled), a hover step the eye sees, and a pressed step past it. Adds `color.surface.inverse-pressed`, `color.surface.brand-pressed`, `palette.neutral.400` and `palette.yellow.550`. `color.surface.inverse-hover` moves to `palette.neutral.700` in light and `color.surface.brand-hover` to `palette.yellow.550` in light, so hover shows on the components that use them. The contract's Pointer feedback rule asks the same of every part a pointer presses.
- bce9a1b: Adds `Popover`.
- 18e6075: Adds `Progress`, and the owned string `inProgress`, in all four locales. Adds the token `duration.progress-sweep`, the loop of an indeterminate progress bar's segment, and `size.meter-track` and `duration.meter` now name a progress bar's track and fill too.
- 419c1c1: Adds `RadioGroup`, with its `Radio`.
- 4315ba6: Adds `ReportStrip`, with its counts type `ReportStripCounts`. It owns no new strings. The contract in the docs data now names `grouped`, the helper that writes a count in digits grouped by a no-break space, among its shared helpers, which DayProfileChart now imports, with no change to what it writes.
- 88d933b: Adds `ScaleBar`, and the owned strings `scale`, `metersUnit` and `kilometersUnit`, in all four locales.
- 12f361a: Adds `SearchField`, and the owned string `noMatches`, in all four locales.
- 8f81bbe: Adds `Section`.
- f85228a: Adds `SegmentedControl`, with `Segment`, and their props types `SegmentedControlProps` and `SegmentProps`. The contract in the docs data now names `rendered`, the story helper that reads the value a token renders as, and `onHover`, the one that reads what the `(hover: hover)` rules set on an element, among its shared helpers.
- 8f3e72a: Adds `Select`, with its `SelectItem` and `SelectGroup` types, and the `chevron-down` icon it opens its list with.
- 3777e47: Adds `Separator`.
- 259a80b: Adds `SeverityLabel`, and the owned strings `diversions`, `plannedWorks` and `dataFeedProblems` in all four locales; `delays` now also names the delay kind of disruption.
- e78eb6e: Adds `Sheet`.
- 8ce125f: Adds `Slider`, and the owned strings `minimum` and `maximum`, in all four locales. The token `size.meter-track` now describes the track of a meter or a slider.
- e3568b9: Adds `Stat`. Adds the owned string `unknown` to every locale; a caller that supplies its own dictionaries adds it too.
- ea1e4d2: Adds `StationIcon`.
- aab1425: Adds `StopTimeline`. Adds the owned strings `nextStop` and `passed` to every locale; a caller that supplies its own dictionaries adds them too.
- e468801: Adds `color.surface.inverse-hover`, the hover fill of a primary button, one step from `color.surface.inverse` in each theme.
- 56271c4: Adds `Surface`.
- a714940: Adds `Switch`, and the token `duration.switch` (150 ms, 0.01 ms under reduced motion) for its thumb's slide and its track's fill.
- 8e26504: Adds `Tabs`, with `TabsList`, `Tab` and `TabsPanel`, and their props types `TabsProps`, `TabsListProps`, `TabProps` and `TabsPanelProps`.
- 6175760: Adds `Tag`.
- 61586c3: Adds `TextArea`.
- e0a2b63: Adds `TextField`.
- 55e3d5e: Adds `Text`.
- d26f979: Adds `Toast`, and the owned string `notifications`, in all four locales, and the tokens `size.toast-width` (360 px), the width of the toast column, and `duration.toast` (200 ms, 0.01 ms with reduced motion), its slide in and out.

  `PerronProvider` now holds the app's one list of toasts and renders the region at the bottom of the screen that shows them, an empty "Notifications" region until a toast arrives, and takes `notificationsLabel` to rename it.

- 3a6f801: Adds `Toolbar`, with `ToolbarButton`, `ToolbarGroup` and `ToolbarSeparator`, and their props types `ToolbarProps`, `ToolbarButtonProps`, `ToolbarGroupProps` and `ToolbarSeparatorProps`.
- 63f81b9: Adds `Tooltip`, a short label beside a control, shown on hover or keyboard focus. `PerronProvider` now groups the tooltips inside it, so once one is open the next opens at once.
- 50df3c7: Adds the typography role `typography.lead`, the paragraph under a page title: the body family at 16 px, regular weight, with the normal line height.
- 5a7e510: Adds `VehicleDotLabel`.
- b08320a: Adds `VehicleDotLegend`, the key to the vehicle dots: the five data states, each as its dot beside its word.
- fd6ec35: Adds the `vehicle-dot.no-signal.cut-width` token: a no-signal vehicle dot is cut by a diagonal slash, so it keeps a shape of its own when colour is gone, as in Windows' contrast themes.
- 4315ba6: `line` is now optional on `VehicleDot` and `VehicleDotLabel`, with no default. Left out, the root sets no `data-line` and the dot draws in the colour of the text around it, for a dot that stands for a state across many lines, such as ReportStrip's counts; in forced colours it draws in the system's text colour, as every dot does.
- 213d4f9: The `prik.*` tokens are now `vehicle-dot.*` and the `--perron-prik-*` custom properties are now `--perron-vehicle-dot-*`. The planned components Prik, PrikLabel and PrikLegend are now VehicleDot, VehicleDotLabel and VehicleDotLegend. `docs/renames.md` lists the change.
- 12834ee: Adds `VehicleDot`.
- 7247afb: Adds `VehicleTable`, and the owned strings `lineColumn`, `destinationColumn`, `positionColumn` and `delayColumn`, in all four locales; a caller that supplies its own dictionaries adds them too.

### Patch Changes

- 2d85a5d: The contract in the docs data now names `components/<name>/`, where a component's place in the factory loop is kept: its pipeline state, its review and its visual report.
- 3693818: The contract in the docs data says the `props` check now reads every `*Props` a component file exports, so a compound component's parts keep to the props vocabulary too.
- f5394bf: The contract in the docs data now gives Button's real class and variant names in its Styling examples (`pn-Button-startIcon`, `data-variant='outline'`), notes that `'outline'` and `'outlined'` have both shipped, and says the contract story renders a component's alphabetically first story when it has no `Default`.
- 585d0ca: The contract in the docs data now has the `docs` check fail on a component whose code the docs page's docgen reads no props from.
- e19cd28: The contract in the docs data now says a docs page's props table lists the members a component's props type inherits from Base UI, and the spec template writes repo paths the docs site doesn't serve as code spans.
- 94d8216: The contract in the docs data now says the docs page shows each story's first render without its `play`, and how an overlay's stories open it and render in their own frame.
- edf133e: The contract in the docs data now says a docs page's props table shows a prop's `@default` where the component has no destructuring default to write, such as `@default The locale's` on an owned-string prop, and has the `docs` check fail on a prop whose default the table would show otherwise than the spec gives.
- 980ed79: StationIcon and Delay inherit `render` from Base UI's `useRender.ComponentProps<'span'>` instead of declaring it again, so their docs show Base UI's own JSDoc for it, as every other component does. The prop accepts the same elements and functions as before.

  Text inherits `render` the same way; with no `render` it still renders a `<p>` for `body` and `body-sm` and a `<span>` for every other role.

- 3166408: The contract in the docs data now lists the `penpot` check, which holds each design read back from Penpot to Perron's tokens and its code map.
- c3a427c: The contract in the docs data says the `props` check now fails a `render` a component declares itself, since every component inherits it from Base UI.
- 9fd5338: The docs data carries retro 10's contract: a Keyboard row no `play` test can reproduce says `Untested: <reason>`, a repeated child is a part exported from its parent's file, the `shared-parts` gate compares unit tests' helpers too, and `rendered` reads a border or outline width.
- 4599bdd: The docs data's specs and contract: every component's and pattern's Props table now has rows for `className`, `style` and `ref`, which every docs page shows; the contract allows `1lh` in component CSS; the spec template says how an answered question is written and which story the contract story renders; and Toolbar's spec states its decisions without an "Answered" label.
- The contract in the docs data now defines the subject story the contract story renders, says a `play` that measures text asserts relations rather than line counts, and that an overlay's `play` finds its popup through `screen`; DetailHeader's spec says its `LongTitle` subheader wraps.
- 7e668f1: Stat, FactList, EmptyState, Section, Tabs, Toolbar, MapControls, DetailHeader, DisruptionCard, DataStatePanel and KioskBar share one internal copy of their helpers, with no change to their props or what they render. The contract in the docs data now lists the shared helpers, and says a part a second component needs moves to the shared parts.
- f9d9f29: A word longer than its line now breaks inside SeverityLabel's name, Sheet's content and StopTimeline's name column rather than overflowing them. The contract in the docs data now says every rule that sets a typography role decides what a long word does.
- d04aea7: The contract in the docs data now says when a long word breaks with `overflow-wrap: anywhere` and when with `break-word`, that `white-space: pre-wrap` and `pre-line` leave it to overflow, and lists the `heard` and `mounted` story helpers among the shared helpers.
- 69f5c5f: Dialog, Sheet and MapTooltip share one internal copy of their class and token helpers (`withClass`, `given`, `tokenValue`), with no change to their props or what they render. The contract in the docs data now says a component reads a token in script from its custom property with `tokenValue`, never from `tokens.ts`, lists `withClass`, `tokenValue` and the unit tests' `heardMarkup` among the shared helpers, says a renamed copy of a helper fails the check, and says a component that floats as glass composes Surface's glass variant. SeverityLabel's page no longer suggests making it a link or button through `render`.
- c8594d7: The contract in the docs data now lets a pattern compose the patterns its `dependsOn` names and use every internal helper that reads no Base UI, such as `tokenValue` and `UnknownValue`; says a boolean ending in `Label`, such as `hiddenLabel`, overrides no owned string; and lists the story helpers `icon`, `resolve`, `stateRules` and `stateFill`, with `closed` taking a role or a selector.
- b1ab34c: Checkbox, Dialog, MapTooltip, SearchField, Sheet, Tooltip and DetailPanel write their event and slot types by Base UI's and Perron's public names, which the docs props table shows, in place of file-local aliases such as `ChangeDetails`; their parts with no props of their own take `slotProps` as a plain spread, with no `mergeProps` call; and the contract in the docs data says so. The story helpers' `stateRules` reads a rule whose state starts its selector, `:hover > .x`.
- a89d3ac: Popover writes its event types by Base UI's public name in place of a file-local `ChangeDetails`, spreads its slots that take no props of its own, and its spec in the docs data keeps its run notes below the intro.
- b46ed1b: The specs in the docs data now keep how each was made (the deferred design under ADR 0010, its sources) below a `<!-- run notes -->` line after the intro, which the docs page's intro stops above, and the spec template says to write them there.
- b34be78: The docs data carries retro 9's contract: the story helpers `fill`, `edge`, `fieldPart`, `focusedClose` and `expectNoFocus` in the Shared helpers table, the `shared-parts` and `docs` gates' new rules, and "Reaches the root" for React's props in every spec and in RadioGroup's JSDoc.
- 98c3a94: SearchField: a `placeholder` given through `slotProps.input` reaches the input when the `placeholder` prop is left out; before, the prop's `undefined` replaced it.
- 37d5edb: The contract and the spec template give each prop a component inherits from Base UI, such as `render`, a row in the spec's Props table, marked `inherited`, while the component inherits it as it is.
- db037ab: Every component, every pattern and `PerronProvider` open with the `'use client'` directive, so a React Server Components app, such as a Next.js one, can import `@mylder/perron` from a server module: the components arrive as client references instead of failing with `createContext is not a function`.
- 86707a5: VehicleDotLegend's dots no longer take a placeholder `line='m1'` recoloured by the legend's CSS: they take no line and draw in the legend's ink, as VehicleDot does with no line, so the dots lose their `data-line` and look the same. VehicleDot, VehicleDotLabel, VehicleDotLegend, DepartureRow and ReportStrip now read the five data states and their owned strings from one internal table; their markup is unchanged.

## 0.2.0

### Minor Changes

- 5d5f868: Depend on Base UI (`@base-ui/react` 1.9.0, pinned) and take `react` and `react-dom` 19 from the app as peer dependencies.
- 84fa566: The docs data now holds the component contract, with the rules its checks and story tests hold every component and pattern to, and the spec template, and `search_docs` finds both.
- a1df949: Add the `@mylder/perron/patterns` entry point, where Mylder's patterns are exported once they are built.
- d618c3c: Add `PerronProvider`, whose `locale` (`en`, `da`, `sv` or `nb`) picks the language of every string a component owns, the `useOwnedStrings` hook that reads them, and the English, Danish, Swedish and Norwegian Bokmål dictionaries.

## 0.1.0

### Minor Changes

- 3d522f8: The first release. `@mylder/perron` ships Perron's foundations: the design tokens as CSS custom properties and TypeScript, the fonts, the icons, the Mylder mark, and the token and docs data the MCP server reads. `@mylder/perron-mcp` is the MCP server, with `list_tokens`, `search_docs` and `get_reference`.
