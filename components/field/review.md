# Review: Field, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/Field/Field.tsx:125` This is still open from round 1. When `error` is given with `invalid={false}`, the error still shows, because `match={true}` comes from `error` alone. But the root, the label and the control get no `data-invalid` or `aria-invalid`. The installed `FieldRoot` computes `invalid = invalidProp === true || hasFormError`, so `false` behaves exactly like leaving `invalid` out. The eye sees a message in `color.text.danger`, while the ear hears the same words only as a description, with no invalid state. CR-4 asks for exactly this, and the prose at `docs/components/field.md:43` ("a caller's `invalid={false}` still wins") doesn't say that the message stays on show. Question for the maintainer: keep this, or give `match={invalid !== false}` so the two agree.
- **P3-2.** `packages/perron/src/components/Field/Field.stories.tsx:180` This is still open from round 1. The reason in the comment for turning off axe's `label-title-only` is off. axe's `titleOnlyEvaluate` fails only when the control has no visible label text and does have a `title` or `aria-describedby`. So it is the description's `aria-describedby` that trips the rule, not the hidden label itself. SearchField's `HiddenLabel`, which has no description, passes it. Every hidden-label field with help in TextField, Select and the others will trip it the same way. Settling it once in `.storybook/preview.ts`, or rewording the reason for each story, is the maintainer's call (this is the build's Direction note).
- **P3-3.** `packages/perron/src/components/Field/Field.stories.tsx:99` This is still open from round 1. axe flags only the disabled description's `color.text.tertiary` (about 4:1). The `color-contrast` override turns the rule off for the whole `Disabled` story, so the label, the optional mark, and an error given on a disabled field are unchecked too. TextField, Select and the other dependents will need the same exception. Options: settle one rule for disabled fields, or keep a disabled description in `color.text.secondary` (this is the build's Direction note).
