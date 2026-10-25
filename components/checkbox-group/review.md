# Review: CheckboxGroup, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/CheckboxGroup/CheckboxGroup.stories.tsx:330` The Controlled story's step "an onChange that cancels keeps the list" only tests the story's own `ControlledGroup` wrapper (`if (!details.isCanceled) setValue(next)`, line 298). Base UI never commits a change in a controlled group anyway, so the step would still pass if CheckboxGroup's adapter (CR-3) passed Base UI a copy of `details` or dropped it. No story checks the promise in the `onChange` JSDoc that `details.cancel()` keeps the list in an uncontrolled group. This breaks the contract's Stories rule "a `play` test for every behaviour the component promises". The spec's Controlled row (`docs/components/checkbox-group.md:200`) asks for this weak check and needs rewording too: the cancel should be checked on an uncontrolled group, for example a `mounted` group with `defaultValue`.
- **P2-2.** `docs/components/checkbox-group.md:40` The `CheckboxGroup` row's "Perron sets" column lists `value` and `defaultValue`. The code never sets either one: they reach Base UI's `CheckboxGroup` through `{...rest}`, as the same row's "Passed through" column and CR-3 (line 177) both say. CR-3 holds, so the "Perron sets" cell should list only `onValueChange`, adapted from `onChange`, and the spread.
- **P2-3.** `docs/components/checkbox-group.md:19` Lines 17 and 19 both open with "The root is one element" and say again that `Field.Root`, the Fieldset and Base UI's `CheckboxGroup` render as one `<div role="group">`. Lines 52 and 54 likewise repeat almost word for word the decisions line 50 already states: `description` and `error` with Field's behaviour, Field's inherited validation props, and `label` and `hiddenLabel` passed to Fieldset as `legend` and `hiddenLegend`. This reads twice on the docs page. Under the content-audit's house-voice rule (plain, short sentences), each fact should be said once, with its reasons beside it.

## P3

- **P3-1.** `packages/perron/src/components/CheckboxGroup/CheckboxGroup.tsx:141` `ref` is typed `Ref<HTMLElement>`, following Fieldset and Switch, and is cast to `Ref<HTMLDivElement>` for Base UI's `Field.Root`. Field and SearchField type theirs `Ref<HTMLDivElement>`. The `api-consistency` rule "one name, one type" leaves the group family with two forms, and the maintainer may want to settle on one before RadioGroup copies either.
- **P3-2.** `docs/components/checkbox-group.md:201` The InForm row's "never holds `'s-tog'`" proves nothing, because "S-tog" is disabled and also unticked, so it could never be submitted (stories line 394). The `name` JSDoc's "a disabled one submits nothing" would only be tested with "S-tog" ticked through `defaultValue` while disabled.
- **P3-3.** `docs/components/fieldset.md:143` This file is outside the diff. Fieldset's spec (lines 24 and 143) still says a group's description and error come "through a Field round it, as CheckboxGroup and RadioGroup do". CheckboxGroup renders its own `Field.Root`, and a caller cannot wrap one round it (checkbox-group.md line 52). Those Fieldset lines could name this composition instead, as the build's note suggests.
