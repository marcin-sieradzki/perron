# Review: TextField, round 2

## P1

None.

## P2

None.

## P3

- **P3-1.** `packages/perron/src/components/TextField/TextField.tsx:121` `TextFieldProps` declares `name`, `placeholder`, `required`, `value`, `defaultValue` and `onChange`, but none of them is taken out of `rest`: each reaches the `<input>` through `{...rest}`. CR-3 (`docs/components/text-field.md:167`) wants it this way, so that a key the caller leaves out stays out. The contract's Root rule, though, says "Every prop the props type declares is taken out of `rest` before the spread", and Switch and SearchField follow it. Nothing breaks, because all six are valid `<input>` attributes. The maintainer may want the Root rule to name the native-text exception, or the code to take them out of `rest` and pass them back only when given.
- **P3-2.** `packages/perron/src/components/TextField/TextField.tsx:80` `TextFieldProps` declares `defaultValue` again, narrowed to `string`, although `Field.Control.Props` already declares it. The contract's Props section says the props type declares only its own members. Brief question 4 asked for this, and Base UI's JSDoc for the member is empty, so no documentation is lost. The spec's row at `docs/components/text-field.md:72` reads `defaultValue` in its Base UI prop column, where every other input row reads "on `Field.Control`". The maintainer may want to confirm that narrowing an inherited Base UI member is allowed.
- **P3-3.** `packages/perron/src/components/TextField/TextField.css:46` With forced colours on (checked in Chromium), the invalid edge renders in the same system colour as the rest edge, so an invalid TextField shows only through its error words. The contract's Media queries section allows a `(forced-colors: active)` rule, and the Fields family row could name one for the invalid edge.
- **P3-4.** `packages/perron/tokens/base.tokens.json:1163` `size.input` is still described as "Search field", but the contract's Families text and TextField's Tokens table use it as the height of every field. The description could be widened through the `design-tokens` skill.
- **P3-5.** `packages/perron/src/components/TextField/TextField.css:8` The box sets no `appearance` (Chromium computes it as `auto`) and no opacity override. iOS Safari's own input styles, an inset shadow and dimmed text on a disabled input, may therefore still apply, which would break the contract's CSS rule "Disabled is a colour, never an opacity". No WebKit is installed here, so this is unverified, and the Fields family may want a rule for it.
