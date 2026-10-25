# Review: CheckboxGroup, round 3

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/checkbox-group.md:44` The "Base UI already does" line says the field "shows the first failing message in the error part". That leaves out what Base UI's `FieldError` does when `validate` returns more than one message: it renders them all, as a `<ul>` of `<li>`s. The `Field.Error` row at line 42 and the Tokens rows at lines 131-132 say so, and those rows hold. The line could end "or a list of them", as `docs/components/field.md:37` does.
- **P3-2.** `docs/components/checkbox.md:37` The new `parent` clause says the parent is "ticked while every value in `allValues` is in the group's list". Base UI's `useCheckboxGroupParent` does not check membership. It ticks the parent when `value.length === allValues.length`, which is how `checkbox-group.md:44` describes it ("as many values as `allValues`"). The two specs describe one Base UI behaviour in two ways, and they differ when the list holds a value that `allValues` leaves out. Base UI's source and `checkbox-group.md:44` hold.
- **P3-3.** `docs/components/checkbox-group.md:33` This line says `Fieldset.Root` and `Fieldset.Legend` come through Perron's Fieldset, "never from `@base-ui/react/fieldset` directly". But `packages/perron/src/components/CheckboxGroup/CheckboxGroup.tsx:10` imports the `BaseFieldset` type from that module, and the `slotProps.legend` row (line 88) needs that type. RadioGroup does the same. The line could say that no part is rendered from there, so the type import does not contradict it.
- **P3-4.** `packages/perron/src/components/CheckboxGroup/CheckboxGroup.tsx:86` `ref` is typed `Ref<HTMLElement>`, as Fieldset types its ref. The now-merged RadioGroup types its ref `Ref<HTMLDivElement>` (`RadioGroup.tsx`), as Field does. That leaves the two group components with different types for one prop, against the `api-consistency` rule "one name, one type". The maintainer may want the family to settle on one type.
- **P3-5.** `packages/perron/src/components/CheckboxGroup/CheckboxGroup.stories.tsx:422` The InForm check that `FormData` never holds `'s-tog'` (spec line 201) proves nothing. "S-tog" is both disabled and unticked, so it could never be submitted anyway. To test the `name` JSDoc's promise "a disabled one submits nothing", "S-tog" would need to be ticked through `defaultValue` while disabled.
- **P3-6.** `docs/components/fieldset.md:143` This file is outside the diff. Fieldset's spec (lines 24 and 143) still tells callers to give a group's description and error "through a Field round it, as CheckboxGroup and RadioGroup do". But CheckboxGroup renders its own `Field.Root`, and a caller can't wrap one round it (`checkbox-group.md:52`). Those Fieldset lines could describe CheckboxGroup's composition instead.
