# Fieldset

A named group of related controls, such as the modes shown on the map or the fields of a report form: the group's name above, the caller's controls below it, and one switch that disables them all.

The design is deferred (ADR 0010, `docs/adr/0010-unattended-runs-with-design-deferred.md`): there is no read-back, code map or export, and this spec decides what the drawing would, from the [contract](README.md), the [foundations](../foundations/README.md), [content design](../content-design.md), the tokens and the Base UI reference for `Fieldset` (`@base-ui/react` 1.9.0, installed). Fieldset has nothing in `dependsOn`, no ROADMAP line names it, and the extracted prototype component is not in any branch this run can reach, so nothing here rests on it. Field, the single-field wrapper, is being built beside it and its spec is not yet in a branch this run can read, so the legend's look follows [SearchField](search-field.md)'s label, the one field label that has shipped.

CheckboxGroup and RadioGroup build on Fieldset next: each renders Fieldset with its own Base UI root through `render`, as Base UI's forms guide composes `<Fieldset.Root render={<RadioGroup />}>`, so the group takes Fieldset's legend, its name and its disabled state (CR-5).

## Anatomy

Penpot page `Components/Fieldset`. Family: none, since it draws no box, fill or border and joins no family's treatment; its controls keep their own. Shared parts: `VisuallyHidden`, for a hidden legend.

The drawing has no variant property, so its one variant is `Default`; its design states are rest and disabled, since the group itself takes no pointer or focus. Its layers are the parts below.

| Part (Penpot layer) | What it is                                                                                                                                                                                 | Base UI part      | Class                | `slotProps` key |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------- | --------------- |
| `root`              | A native `<fieldset>`, a flex column that stacks the legend over the caller's controls and takes its container's width, named by the legend. Penpot's main instance, a vertical flex board | `Fieldset.Root`   | `pn-Fieldset`        | none            |
| `legend`            | A `<div>` holding the caller's `legend`, the group's name, first in the root; with `hiddenLegend`, a `VisuallyHidden` span the eye never sees                                              | `Fieldset.Legend` | `pn-Fieldset-legend` | `legend`        |

The caller's `children`, the controls, follow the legend straight inside the root, with no wrapper of Fieldset's own: a component that renders Fieldset as a Base UI group (CR-5) needs its items to be the group's own children, and the root's one gap spaces the legend and each control alike (CR-2).

Fieldset takes no description and no error message. Base UI's Fieldset has only `Fieldset.Root` and `Fieldset.Legend`, the two parts the registry entry lists, and its forms guide puts a group's description and error in a `Field.Root` around the fieldset, through `Field.Description` and `Field.Error`, where Base UI ties them to the group as the field's control. CheckboxGroup and RadioGroup take them that way, through Field, and either can join Fieldset later as an optional prop without a break.

## Base UI parts

Imported from `@base-ui/react/fieldset`, at the version pinned in `packages/perron/package.json` (1.9.0).

| Base UI part      | Renders                                                                                                                                                                                                                   | Perron sets                                                                                                                                                                                                | Passed through                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Fieldset.Root`   | `<fieldset>`, or the element `render` gives, with `aria-labelledby` the legend's id, the native `disabled` attribute and `data-disabled` while it or a fieldset round it is disabled                                      | `className` (`pn-Fieldset`, then the caller's), `ref`, `disabled` from `disabled`, and its children: the legend part, then `children`                                                                      | `render`, `style`, `name`, `form`, `id` and every other prop of a native `<fieldset>`, through `{...rest}` |
| `Fieldset.Legend` | `<div>` with an `id` (`slotProps.legend.id`, else one Base UI generates and registers with the root), and `data-disabled` while the fieldset is disabled; with `hiddenLegend`, the `VisuallyHidden` span through `render` | `className` (`pn-Fieldset-legend`, then the caller's, through `withClass`), `legend` as children, and `render: <VisuallyHidden />` when `hiddenLegend`, merged with `mergeProps`, Perron's own last (CR-4) | `slotProps.legend`                                                                                         |

Base UI already does: it gives the root the legend's id as `aria-labelledby`, whatever id the legend ends up with, so the group is named by its legend; it sets the native `disabled` attribute on the `<fieldset>`, so the browser disables every native control inside it (`<input>`, `<button>`, `<select>`, `<textarea>`) and takes them out of the tab order; it sets `data-disabled` on the root and the legend; and it shares the disabled state through its context, so a nested `Fieldset.Root`, a `Field.Root` and a `RadioGroup` inside it are disabled too, a parent's `disabled` winning over a child's `false`. With `render`, it hands the rendered element `aria-labelledby` and `disabled` as props, and an element's own props win over them.

## Props

In MUI's layout. Every prop here gets this description as its JSDoc. Slots come last.

| Name                 | Type                    | Default | Base UI prop                 | Description                                                                                                                                                                                                     |
| -------------------- | ----------------------- | ------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legend`             | `ReactNode`             | none    | `Fieldset.Legend`'s children | Required. The group's name, in sentence case, a few words or a short question, such as "Show on the map": shown above the controls, and the group's accessible name.                                            |
| `hiddenLegend`       | `boolean`               | `false` | none                         | Whether the legend is heard but not seen. Use it where a heading right above already names the group for the eye, so the group keeps its name for the ear.                                                      |
| `disabled`           | `boolean`               | `false` | `disabled`                   | Whether every control in the group ignores the pointer and the keys. Native controls leave the tab order; Base UI's fields and groups inside take the disabled look; a fieldset round this one disables it too. |
| `children`           | `ReactNode`             | none    | none                         | The group's controls, in reading order, below the legend: checkboxes, radios, or fields.                                                                                                                        |
| `render`             | Base UI's `render`      | none    | inherited                    | Inherited from Base UI: swaps the root element and keeps the behaviour, the class and the data attributes. CheckboxGroup and RadioGroup give their Base UI group here.                                          |
| `className`, `style` | React's                 | none    | none                         | Reach the root. `className` is merged after `pn-Fieldset`.                                                                                                                                                      |
| `ref`                | `Ref<HTMLElement>`      | none    | none                         | Reaches the root: the `<fieldset>`, or the element `render` gives.                                                                                                                                              |
| `slotProps.legend`   | `Fieldset.Legend.Props` | none    | `Fieldset.Legend`            | Props for the `legend` part. Its `id` is the one the group's `aria-labelledby` points at.                                                                                                                       |

`FieldsetProps` extends `Fieldset.Root.Props`, so `render` comes inherited with Base UI's JSDoc and is not declared again, and declares `legend`, `hiddenLegend`, `disabled`, `children`, `ref` and `slotProps`. `disabled` is a native `<fieldset>` attribute that `Fieldset.Root.Props` already carries; Fieldset declares it again so it gets its JSDoc and its `false` default. The other attributes of a `<fieldset>`, such as `name`, `form` and `id`, reach the root through `{...rest}` and get no row, as the contract's Props section says. No owned string, so no `*Label` prop.

- The group's name is the `legend` prop, required: the name of Base UI's part and of the HTML element it stands for, and a group without a name is announced as an unnamed group. `hiddenLegend` keeps it for the ear where the eye needs none.
- Fieldset ships with no `variant`, `size` or `color`, one look everywhere, so its root carries no `data-variant`, `data-size` or `data-color`; Base UI's `data-disabled` is its one data attribute. Any of the three can join later as an optional prop without a break.
- `hiddenLegend`, a boolean, default `false`, renders the legend through the `VisuallyHidden` shared part. It follows SearchField's `hiddenLabel`, MUI's own name for a field without a visible label, with the part's name in place of "label", and works as it does: a settings group under a Section heading that already names it keeps its name for the ear without saying it twice to the eye, and CheckboxGroup and RadioGroup can pass their own `hiddenLabel` straight to it. No name here is one the contract's [Names from other libraries](README.md#names-from-other-libraries) table bans.

## Tokens

One row per part, state and property. Fieldset has no hover, focus or pressed state of its own: its controls keep theirs. Its design states are rest and disabled.

| Part     | State    | Property                      | Token                                                    |
| -------- | -------- | ----------------------------- | -------------------------------------------------------- |
| `root`   | rest     | `gap`                         | `space.200`                                              |
| `root`   | rest     | `border`, `margin`, `padding` | none: `0`, resetting the browser's fieldset frame (CR-1) |
| `root`   | rest     | `min-inline-size`             | none: `0`, resetting the browser's `min-content` (CR-1)  |
| `root`   | disabled | none                          | none: the controls take their own disabled look          |
| `legend` | rest     | `font`, `letter-spacing`      | `typography.label`, with its tracking twin               |
| `legend` | rest     | `color`                       | `color.text.primary`                                     |
| `legend` | rest     | `margin`, `padding`           | none: `0`                                                |
| `legend` | disabled | `color`                       | `color.text.tertiary`, on `[data-disabled]`              |

The root is a flex column (`display: flex; flex-direction: column`), so the legend and each control stack in the DOM's order, `space.200` apart, and it takes its container's width. With `hiddenLegend`, the `VisuallyHidden` span is taken out of the flow by the part's own declarations, so the first control sits at the top with no gap above it.

The legend takes `typography.label` in `color.text.primary`, as SearchField's label does, rather than `typography.label-sm`, whose description names "field and stat labels": a RadioGroup's name then reads the same as a text field's name in the same form, SearchField already set field labels in `typography.label`, its 600 weight stands out from options set in `typography.body`, and the Field spec being written beside this one should match it either way.

The root puts one gap, `space.200`, between the legend and each control, with no wrapper round the controls: 8 px is the gap the components use between items in a row and keeps options in a list close under their name, it sits between the 4 px of SearchField's label over its box and the 12 px between the parts of a panel, and one gap on the root keeps the controls the root's own children, which CheckboxGroup and RadioGroup need (CR-5); a group of fields that wants more room sets its own `gap` through `className`.

## Keyboard and ARIA

Fieldset has no keys of its own and is never focusable. Its controls are reached in reading order, and keep their own keys.

| Key         | Does                                                                                                       | From        |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| `Tab`       | Moves to the first focusable control in the group, then on through the rest; skips them all while disabled | The browser |
| `Shift+Tab` | Moves back through the controls, out to what came before the group                                         | The browser |

| Element  | Role                                                                                                                           | Accessible name from                                       | States announced                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`   | `group`, native to `<fieldset>`; the rendered element's own role with `render`, such as `radiogroup` from Base UI's RadioGroup | `aria-labelledby`, the legend's id, from Base UI: its text | None on the group itself; the native `disabled` attribute disables each native control in it, and each control announces its own disabled state |
| `legend` | None (generic `div`, or a `span` when hidden)                                                                                  | None: its text names the root                              | None                                                                                                                                            |

What axe won't catch, from the contract, each with how this component meets it:

- [ ] Everything the eye is told, the ear is told, for every shape each prop accepts: the legend the eye reads above the controls is the group's name for the ear, through `aria-labelledby`; a hidden legend is still the name; the disabled look of the legend matches the disabled state the browser announces on each control in the group, since the native `disabled` attribute disables them all.
- [ ] Every landmark and named region has an accessible name: the root is a `group`, not a landmark, and is always named by its legend, since `legend` is required (CR-3).
- [ ] Every default label can be overridden: none here; Fieldset owns no string.
- [ ] Every shape the type accepts renders, in every variant: `legend` renders a string, an element and an array; it sits in a `<div>`, or a `<span>` when hidden, so it takes phrasing content, and a long Danish compound wraps inside the root's width (CR-1).
- [ ] A hidden copy kept for animation is `aria-hidden`, and a collapsed region is `inert`: none here; nothing animates or collapses.
- [ ] Native semantics first: a native `<fieldset>` and its `group` role, its native `disabled` attribute, and Base UI's `aria-labelledby`; Perron adds no ARIA.
- [ ] Focus moves in reading order and returns on close: the legend comes first in the DOM and on screen, then the controls in the caller's order; Fieldset never moves focus, and nothing in it closes.
- [ ] Every target is at least `size.target-min` square: Fieldset has no target of its own; its controls are the caller's components, which keep their own sizes.
- [ ] Loops stop when the system asks for less motion: none here; nothing moves.

## Owned strings

No owned strings: every word Fieldset shows or announces comes from the caller, through `legend` and `children`, and the group's name is the legend.

## Component rules

Rules for this component alone, numbered so the build and the review can cite them.

- **CR-1.** The root resets the browser's fieldset frame: `border: 0`, `margin: 0`, `padding: 0` and `min-inline-size: 0`, so it draws no box and takes its container's width rather than its widest content's, and the legend sets `margin: 0`. The legend breaks a word longer than its line (`overflow-wrap: anywhere`), so "Realtidsdataforsinkelser", about 152 px wide in `typography.label`, wraps inside the root in a 120 px column.
- **CR-2.** The root is a flex column with `gap: space.200` between the legend and each child, and the controls are the root's own children, with no wrapper of Fieldset's. Fieldset sets no `background`, `box-shadow`, `inline-size` or `max-inline-size`, and never sets `overflow`, so a focused control's ring, drawn `focus.offset` outside it, is never cut at the edge.
- **CR-3.** `legend` is required and always renders: the group always has a name. With `hiddenLegend` it renders through `render: <VisuallyHidden />`, so its text stays in the accessibility tree and names the group, and no gap opens above the first control.
- **CR-4.** `legend`, `hiddenLegend`, `disabled`, `children` and `slotProps` are taken out of `rest` before it reaches `Fieldset.Root`, and `{...rest}` comes before Fieldset's own props, so none of them reaches the `<fieldset>` as an attribute. The legend's props are `slotProps.legend` merged with `mergeProps`, Fieldset's own last, so its class and children stay while the caller's `className` joins and its `id` reaches Base UI, which points the root's `aria-labelledby` at it.
- **CR-5.** Fieldset composes with `render`: `<Fieldset render={<CheckboxGroup />} legend="Show on the map">`, with Base UI's group, keeps `pn-Fieldset` and the legend, and Base UI hands the rendered group the legend's id as `aria-labelledby` and Fieldset's `disabled` as its own prop, so the group is named by the legend and disabled with it, as Base UI's forms guide composes Fieldset with `CheckboxGroup` and `RadioGroup`. A component built this way sets its own spacing through its own class on the same element. Rendered as anything other than a `<fieldset>`, the browser's own disabling of native controls no longer applies, and only Base UI's context and the rendered component's `disabled` carry it.
- **CR-6.** Disabled is Base UI's: `disabled` reaches `Fieldset.Root`, which sets the native attribute, `data-disabled` and its context. The legend takes `color.text.tertiary` on `[data-disabled]`, never an opacity, and the root draws nothing for it; a disabled fieldset round this one disables it too, through Base UI's context, and the legend then carries `data-disabled` as well.
- **CR-7.** Fieldset never moves focus, sets no `tabindex` and adds no role beyond its native element's.

## Stories

One per variant and state the design would show. The design is deferred and has no variant property, so its one variant is `Default`; `Disabled` is its disabled state, and `HiddenLegend` the same variant with the legend for the ear only. Each sits on a `raised` Surface, as a group sits in a panel. Checkbox and the text fields are not built yet, so each story's controls are native `<label>`s, each holding an `<input type="checkbox">` and its word, set in `typography.body` with the `typography` helper; the stories move to Checkbox when it ships.

| Story          | Shows                                                                                                                                                        | `play` test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default`      | `legend` "Show on the map" over three checkboxes, "Bus", "Metro" and "S-tog", at rest. The subject story: its args render Fieldset alone and pass every rule | A `group` named "Show on the map" holds the three checkboxes; the legend is the root's first child and renders `typography.label` in `color.text.primary`; Tab reaches "Bus" and Shift+Tab leaves it, so focus ends where it started; `mount` renders `render={<RadioGroup />}` from Base UI with two `Radio.Root`s under the legend "Map style" and finds a `radiogroup` named "Map style" that keeps `pn-Fieldset` (CR-5); `mount` renders the legend "Realtidsdataforsinkelser" in a 120 px column and finds it wraps onto more than one line inside the root (CR-1) |
| `Disabled`     | The `Default` group with `disabled`                                                                                                                          | The `<fieldset>` has the `disabled` attribute and `data-disabled`; every checkbox is disabled, and Tab from before the group passes over them all; the legend has `data-disabled` and its colour is `color.text.tertiary`                                                                                                                                                                                                                                                                                                                                               |
| `HiddenLegend` | The `Default` group with `hiddenLegend`, inside a [Section](section.md) titled "Show on the map" that names it for the eye                                   | The `group` is still named "Show on the map"; the legend renders as the `VisuallyHidden` span; the first checkbox sits at the root's top edge, with no gap above it                                                                                                                                                                                                                                                                                                                                                                                                     |

## Do and don't

For a caller using the component, with the reason.

| Do                                                                                                                                      | Don't                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group controls that answer one question, such as which modes to show, or fields that belong together, such as a report's place and time | Wrap a single control in a Fieldset: one control is named by its own label, through Field                                                                                             |
| Write the legend in sentence case, a few words or a short question: "Show on the map"                                                   | Put a heading element inside `legend`, or type it in capitals: the legend is already the group's name, and a heading inside it adds one to the page's outline that no section follows |
| Use CheckboxGroup or RadioGroup for a set of checkboxes or radios, once they ship: they compose Fieldset with the group's behaviour     | Render Fieldset as a Base UI group yourself in a screen: the groups hold the value, the keys and the form name for you                                                                |
| Disable the whole group with `disabled`, so every control in it goes together                                                           | Disable each control by hand inside a Fieldset that stays enabled: the legend then looks live over dead controls                                                                      |
| Use `hiddenLegend` where a heading right above already names the group for the eye                                                      | Leave out the legend, or replace it with an `aria-label` on the root: the legend is the group's one name, seen and heard alike                                                        |
| Use Section for a titled block of content in a panel                                                                                    | Use Fieldset to title content that holds no controls: a `group` with nothing to fill in tells a screen reader there is something to fill in                                           |
| Give the group's description and error through a Field round it, as CheckboxGroup and RadioGroup do                                     | Put a hint or an error as plain text among the controls: nothing ties it to the group for the ear                                                                                     |
