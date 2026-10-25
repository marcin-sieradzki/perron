# Review: CheckboxGroup, round 2

## P1

None.

## P2

- **P2-1.** `docs/components/checkbox-group.md:62` This line says "`disabled` and `name` are declared again for their JSDoc, since each reaches more than one Base UI part", but `name` is not declared again. Base UI's `CheckboxGroup.Props` has no `name`, as line 52 of the spec says ("Base UI's `CheckboxGroup` has no `name`"), and `<div>` props do not include one either. `CheckboxGroupProps` also does not pick `name` from `Field.Root.Props` (`CheckboxGroup.tsx:23-32`). And `name` reaches only one part, `Field.Root`, as the Props row at line 75 says. Line 52 and the Props row are right. The fix is to rewrite line 62 so that only `disabled` is declared again, and `name` is declared because neither Base UI type it extends gives it.

## P3

- **P3-1.** `docs/components/checkbox-group.md:33` This line says `Fieldset.Root` and `Fieldset.Legend` come through Perron's Fieldset, "never from `@base-ui/react/fieldset` directly". But `packages/perron/src/components/CheckboxGroup/CheckboxGroup.tsx:10` imports the `BaseFieldset` type from that module, and the `slotProps.legend` row (line 88) needs that type. RadioGroup does the same. The line could say that no part is rendered from there, so the type import does not contradict it.
- **P3-2.** `packages/perron/src/components/CheckboxGroup/CheckboxGroup.tsx:86` `ref` is typed `Ref<HTMLElement>`, as Fieldset, Checkbox and Switch type theirs. RadioGroup is now `stable` with `Ref<HTMLDivElement>` (`RadioGroup.tsx:99`), as Field and SearchField are. That leaves the two group components with different types for one prop, against the `api-consistency` rule "one name, one type". The maintainer may want the family to settle on one type.
- **P3-3.** `docs/components/checkbox-group.md:201` The InForm row's check that `FormData` "never holds `'s-tog'`" proves nothing (stories line 422): "S-tog" is both disabled and unticked, so it could never be submitted anyway. To test the `name` JSDoc's promise "a disabled one submits nothing", "S-tog" would need to be ticked through `defaultValue` while disabled.
- **P3-4.** `docs/components/fieldset.md:143` This file is outside the diff. Fieldset's spec (lines 24 and 143) still tells callers to give a group's description and error "through a Field round it, as CheckboxGroup and RadioGroup do". But CheckboxGroup renders its own `Field.Root`, and a caller can't wrap one round it (`checkbox-group.md:52`). Those Fieldset lines could describe CheckboxGroup's composition instead.
