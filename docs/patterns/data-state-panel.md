# DataStatePanel

Holds a data view, such as a vehicle table or a day's chart, and shows the caller's content once its data is in, or in its place a calm message while the data loads, when there is none, or when it could not be loaded.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): this spec decides what the drawing would, from the [contract](../components/README.md), the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the spec of [EmptyState](../components/empty-state.md), the one entry in its `dependsOn`. The ROADMAP names it among the patterns (7.2) and the registry files it under Data, beside ReportStrip, VehicleTable and DayProfileChart, the views it is for. As a pattern it imports only Perron's components and parts, never `@base-ui/react`.

DataStatePanel is the wrapper that shows a data view's loading, empty and error messages in place of its content, built on EmptyState. The words "data state" elsewhere name the five Prik states, which PrikLegend explains, and its docs say once that its `status` is not a Prik data state.

## Anatomy

Penpot page `Patterns/DataStatePanel`. Family: none, since it draws no surface and sits on the panel, sheet or card that holds it. Shared parts: none.

| Part (Penpot layer) | What it is                                                                                                                                                                                                 | Base UI part                | Class                          | `slotProps` key |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------ | --------------- |
| `root`              | A `div` holding the `message` part and, once `status` is `'ready'`, the caller's `children`                                                                                                                | None: a `div`               | `pn-DataStatePanel`            | none            |
| `message`           | A `div` with `role="status"`, always rendered, so a change of status is announced: it holds the `emptyState` part while `status` is `'loading'`, `'empty'` or `'error'`, and nothing while it is `'ready'` | None: a `div`               | `pn-DataStatePanel-message`    | `message`       |
| `emptyState`        | Perron's [EmptyState](../components/empty-state.md), its title the status's owned string, with the caller's `description` and `action` under it in the empty and error statuses                            | None: Perron's `EmptyState` | `pn-DataStatePanel-emptyState` | `emptyState`    |

No part has a Base UI part: a pattern builds on Perron's components, never on `@base-ui/react` (the contract's [Patterns](../components/README.md#patterns)), and none of these parts has behaviour of its own for Base UI to give. The root and the message part are plain `div`s, and the `emptyState` part is the EmptyState component, which renders its own parts through `useRender`.

The message part stays mounted, `role="status"`, in every status, empty while `status` is `'ready'`, so screen readers announce each change, and the caller's `children` render beside it, not inside it. A live region added to the page with its text already in it is often not announced, and the caller's table or chart stays outside the live region, or every refresh of it would be read out.

## Base UI parts

No Base UI part: a pattern imports only Perron's components and parts, React and its own files (the contract's [Patterns](../components/README.md#patterns)), so it has no `render` prop and nothing inherited from Base UI. What it composes instead:

| Base UI part                | Renders                                      | Perron sets                                                                                                                                                                        | Passed through                                                                           |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| None: a `div` for root      | `div`                                        | `ref`, the class `pn-DataStatePanel`, `data-status` with `status`, the message part and then `children` when `status` is `'ready'`                                                 | `className`, `style`, `ref` and the rest of the `div` props                              |
| None: a `div` for message   | `div`                                        | The class `pn-DataStatePanel-message`, `role="status"`, `tabIndex={-1}` (CR-6), the `emptyState` part as children unless `status` is `'ready'`                                     | `slotProps.message`                                                                      |
| None: Perron's `EmptyState` | EmptyState's `div`, with its own inner parts | The class `pn-DataStatePanel-emptyState`, `title` from the status's owned string, and in the empty and error statuses `description` as its `children` and `action` as its `action` | `slotProps.emptyState`: EmptyState's own props, such as `icon` and its `slotProps.title` |

Base UI already does: nothing here directly. EmptyState, through `useRender`, swaps its parts' elements on `render` and joins `className` strings, as its spec says.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                   | Type                                                       | Default      | Base UI prop | Description                                                                                                                                                                                                                      |
| ---------------------- | ---------------------------------------------------------- | ------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`               | `'ready' \| 'loading' \| 'empty' \| 'error'`               | `'ready'`    | none         | Where the data view's data stands: `ready` shows `children`; `loading` says "Loading" while there is no data yet; `empty` says the data came back with nothing in it; `error` says it could not be loaded. Not a Prik data state |
| `children`             | `ReactNode`                                                |              | none         | The data view itself, such as a table or a chart, shown only while `status` is `'ready'`                                                                                                                                         |
| `description`          | `ReactNode`                                                |              | none         | The sentence under the message in the empty and error statuses: why, and what to try. "Try again in a minute." Not shown while loading or ready                                                                                  |
| `action`               | `ReactNode`                                                |              | none         | What the person can do about it in the empty and error statuses, such as a button that loads the data again, below the sentence. Not shown while loading or ready                                                                |
| `loadingLabel`         | `string`                                                   | The locale's | none         | Overrides "Loading", the message while `status` is `'loading'`                                                                                                                                                                   |
| `noDataLabel`          | `string`                                                   | The locale's | none         | Overrides "No data to show", the message while `status` is `'empty'`. Give it what is missing when the caller knows: "No vehicles on line 5C right now"                                                                          |
| `loadFailedLabel`      | `string`                                                   | The locale's | none         | Overrides "Could not load the data", the message while `status` is `'error'`                                                                                                                                                     |
| `slotProps.message`    | `ComponentPropsWithRef<'div'>`                             |              | none         | Props for the `message` part                                                                                                                                                                                                     |
| `slotProps.emptyState` | `Omit<EmptyStateProps, 'title' \| 'children' \| 'action'>` |              | none         | Props for the `emptyState` part, the EmptyState: its `icon`, its `slotProps`, a `className`                                                                                                                                      |

`className`, `style`, `ref` and the other `div` props reach the root, as the contract's Root section says. The root has no Base UI part, so there is no `render` and no inherited row.

`status` is optional, with the default `'ready'`, the first value, as the contract makes a variant's, so `<DataStatePanel>{table}</DataStatePanel>` renders the table and a caller adds `status` only while the data is not in. `status` is free in the contract's [Names from other libraries](../components/README.md#names-from-other-libraries) table, where `state` is not.
The caller gives the sentence and the action as `description` and `action`, shown in the empty and error statuses only, and anything else EmptyState takes, such as its `icon`, through `slotProps.emptyState`. `children` is the data view, so the sentence cannot be `children` as it is on EmptyState; `description` is the name of EmptyState's part for it, and `action` is EmptyState's own prop. Loading shows no sentence or action, since there is nothing yet to explain or act on.
DataStatePanel draws no icon of its own; the caller gives one through `slotProps.emptyState.icon`, such as `signal-off` in the error status. Perron's icons are inlined in the component that owns them, a pattern cannot borrow another's, and the icon is decorative, hidden from screen readers, with the title saying what it shows.

## Tokens

DataStatePanel sets no token of its own: the root and the message part have no fill, border, radius, padding or gap, so the panel takes the surface it sits on, and every message wears EmptyState's look, its tokens on [EmptyState](../components/empty-state.md#tokens). The root is a block that sizes to its container; the message part, empty while `status` is `'ready'`, takes no space.

All three messages, loading included, wear EmptyState's look unchanged, with no spinner, skeleton or animation, and the panel keeps no minimum height between statuses. The brand is calm and a loop needs a `duration.*` token no foundation gives a spinner; a skeleton would draw rows the data may not have, claiming more than it knows; and no `size.*` token gives a panel's height, so one goes through the `design-tokens` skill when a design asks for it.

## Keyboard and ARIA

DataStatePanel has no keys of its own. The action in the empty and error statuses, and the caller's content once ready, are reached in reading order.

| Key         | Does                                                                            | From        |
| ----------- | ------------------------------------------------------------------------------- | ----------- |
| `Tab`       | Moves to the first focusable element in the action, or in `children` once ready | The browser |
| `Shift+Tab` | Moves back out, to whatever came before the DataStatePanel                      | The browser |

| Element      | Role                                                                 | Accessible name from                                                | States announced                                                                                        |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `root`       | None (generic `div`)                                                 | None                                                                | None                                                                                                    |
| `message`    | `status`, a polite live region                                       | None: a status region needs none, and its text is what it announces | Its text whenever it changes: "Loading", the empty or error title with the sentence, nothing when ready |
| `emptyState` | EmptyState's: a paragraph title, the sentence, the caller's controls | Its title's text, from the status's owned string                    | None of its own                                                                                         |

The root takes no `aria-busy` while loading. Screen readers may hold back a busy element's live regions until it is no longer busy, which would silence "Loading", and nothing inside the root is half-built while it loads: the content is not rendered at all.

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the message is the visible title, sentence and action, read in place and announced through the message part's `role="status"`; a caller's `icon` is `aria-hidden` inside EmptyState and the title says what it shows.
- [ ] Every landmark and named region has an accessible name: none here; the root is not a landmark, and a `status` region takes no name.
- [ ] Every default label can be overridden: `loadingLabel`, `noDataLabel` and `loadFailedLabel`.
- [ ] Every shape the type accepts renders, in every variant: `children`, `description` and `action` each render a string, an element and an array; `description` and `action` land in EmptyState's `div` parts, so block content is valid in them.
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; a status not shown is not rendered at all, so nothing hidden stays in the tree.
- [ ] Native semantics first: plain `div`s and EmptyState's `p` title; `role="status"` only on the message part, where no element says it; the action holds the caller's own `button` or `a href`.
- [ ] Focus moves in reading order and returns on close: the message comes before the content in the DOM, the action after the sentence; when a change of status removes the element that had focus inside the message, focus moves to the message part (CR-6), never to the page's top.
- [ ] Every target is at least `size.target-min` square: DataStatePanel has no target of its own; the action's targets are the caller's components, which keep their own sizes.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

Each status but ready shows one string of its own as the EmptyState's title. `loading` is in `packages/perron/src/locale/en.ts` already; `noData` and `loadFailed` are new keys, and agents write their Danish, Swedish and Norwegian.

| Key          | English                 | Override          | Seen or heard where                                                                        |
| ------------ | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| `loading`    | Loading                 | `loadingLabel`    | The `emptyState` part's title while `status` is `'loading'`, announced by the message part |
| `noData`     | No data to show         | `noDataLabel`     | The `emptyState` part's title while `status` is `'empty'`, announced by the message part   |
| `loadFailed` | Could not load the data | `loadFailedLabel` | The `emptyState` part's title while `status` is `'error'`, announced by the message part   |

The empty status's owned string is `noData`, "No data to show", with `noDataLabel` for the caller to name what is missing. It says only what the panel knows, that the data came back with nothing in it, without claiming why; a caller that knows says more through `noDataLabel` or `description`.
The error status's owned string is a new key, `loadFailed`, "Could not load the data", not "Data feed problems". "Data feed problems" is the fixed name of a kind of disruption on a line, which content design keeps for that alone; a panel whose request failed may have lost the network, not the feed, and "Could not load the data" says only what happened.

## Component rules

Rules for this pattern alone, numbered so the build and the review can cite them.

- **CR-1.** Exactly one of two things shows: the caller's `children` while `status` is `'ready'`, or the `emptyState` part in every other status. `children` is not rendered, not hidden, while loading, empty or in error, so a stale table is never read out beside a message.
- **CR-2.** The message part is always rendered, with `role="status"`, as the root's first child, and the caller's `children` come after it, outside it. While `status` is `'ready'` it holds nothing.
- **CR-3.** The `emptyState` part's `title` is the status's owned string, read with `useOwnedStrings({ loading: loadingLabel, noData: noDataLabel, loadFailed: loadFailedLabel })`. `description` becomes its `children` and `action` its `action` in the empty and error statuses only; while loading, it shows the title alone.
- **CR-4.** The root carries `data-status` with `status`, the default included, so CSS and tests can read it; the root sets no role, no `aria-busy` and no `tabindex`.
- **CR-5.** Each part's props are its `slotProps` value with the pattern's own laid over them, its own last: `className` strings joined, the part's class first, and `role`, `title`, `children` and `action` the pattern's. A pattern cannot import Base UI's `mergeProps`, so the merge is written in its own folder. `status`, `description`, `action`, the `*Label` props and `slotProps` are taken out of the rest props before they reach the root.
- **CR-6.** The message part takes `tabIndex={-1}`. When `status` changes while focus is inside the message part, such as on a "Try again" button that sets `status` to `'loading'`, and the focused element is no longer in the document after the change, DataStatePanel moves focus to the message part. It never moves focus otherwise: not on mount, and not into `children` when the data arrives.
- **CR-7.** It sizes to its container, with no width, height or minimum of its own; EmptyState wraps long words, so a long Danish stop name in `noDataLabel` fits a 320 px screen.
- **CR-8.** A `status` is not a Prik data state: DataStatePanel never shows the data-state words ("Live", "No signal"), and a view whose vehicles have gone silent is `'ready'`, its rows showing each vehicle's own state.

When a change of status removes the element that had focus inside the message, such as the "Try again" button once loading starts, focus moves to the message part, made focusable with `tabIndex={-1}` (CR-6). Otherwise focus falls to the page's top, and the contract asks that focus never be lost; the message part is where the person was, and it says what is happening now.

## Stories

One per variant the design would show, named by the `status` value in PascalCase, as `penpot/README.md` names variants. Each story's data view is a short list of three departures as plain text; the empty and error stories give a sentence and an `outline` `neutral` Button.

| Story     | Shows                                                                                                                                               | `play` test                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Ready`   | `status` `'ready'`: the list of departures, and an empty message part                                                                               | The list renders; the `status` region is empty and no `pn-EmptyState` element renders                                                     |
| `Loading` | `status` `'loading'`: the EmptyState with "Loading" alone, no sentence or action, and no list                                                       | The `status` region reads "Loading"; the list, the sentence and the action do not render                                                  |
| `Empty`   | `status` `'empty'`: "No data to show", the sentence "Try another line, such as 5C." and the action "Clear filters"                                  | The `status` region holds the title and the sentence; Tab reaches "Clear filters" and Shift+Tab leaves it, so focus ends where it started |
| `Error`   | `status` `'error'`: "Could not load the data", the sentence "Try again in a minute." and the action "Try again", which sets `status` to `'loading'` | Tab to "Try again" and press Enter: the `status` region reads "Loading" and focus is on the message part (CR-6), not on the page's body   |

## Do and don't

For a caller using the pattern, with the reason.

| Do                                                                                                                                | Don't                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep `status` `'ready'` while fresh data replaces data already shown, and use `'loading'` only while there is nothing to show yet | Flip to `'loading'` on every refresh: the table blinks out every few seconds and the status region reads "Loading" each time                                |
| Name what is missing through `noDataLabel` when the view knows: "No vehicles on line 5C right now"                                | Write "No data" when the view knows what kind: content design asks to say what is happening, plainly                                                        |
| Give the error status one neutral action that loads the data again, such as "Try again"                                           | Add a `brand` action when the panel already has one: a screen has one brand action at most                                                                  |
| Show a vehicle that has gone silent as `'ready'` content, with its Prik state and the words "No signal"                           | Use `'error'` or `'empty'` for a vehicle's data state: `status` is about the view's data request, and the data-state words have their own components        |
| Use plain EmptyState for a list that is empty for a reason the screen already knows, such as a search with no matches             | Wrap a list in DataStatePanel only to show an empty message: it is for views whose data loads, and its status region would announce a state nothing changed |
| Let the message part announce the change, and put the view's own live updates, if any, in the view                                | Add `role="status"` or `aria-live` to `children` or the root: the table's every refresh would be read out, on top of the message                            |
