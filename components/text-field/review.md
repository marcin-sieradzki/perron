# Review: TextField, round 1

## P1

None.

## P2

- **P2-1.** `packages/perron/src/components/TextField/TextField.tsx:12` `TextFieldProps` extends `Field.Control.Props` and omits only `onValueChange`, `ref` and `disabled`, so it still accepts `children` and `dangerouslySetInnerHTML` from React's `<input>` props. The type check passes, but `{...rest}` sends them to the void `<input>`, and React throws: `<TextField label="x">kid</TextField>` fails with "input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`". This breaks the contract's Root rule that a prop invalid on the element never reaches the DOM. The fix is to omit both from the base type and add them to the list on the spec's Props line (`docs/components/text-field.md:48`).

## P3

- **P3-1.** `packages/perron/src/components/TextField/TextField.tsx:80` `TextFieldProps` declares `defaultValue` again, narrowed to `string`, although `Field.Control.Props` already declares it. The contract's Props section says the props type inherits Base UI's members and declares only its own. Base UI's JSDoc for it is empty, so nothing is lost, and brief question 4 asked for it. The spec's row at `docs/components/text-field.md:72` reads `defaultValue` in its Base UI prop column, where the other input rows read "on `Field.Control`". The maintainer may want to confirm that narrowing an inherited Base UI member is allowed.
- **P3-2.** `packages/perron/src/components/TextField/TextField.css:46` With forced colours on (checked in Chromium), the invalid edge renders in the same system colour as the rest edge. An invalid TextField then shows only through its error words. The contract's Media queries section allows a `(forced-colors: active)` rule, and the Fields family row could name one for the invalid edge.
- **P3-3.** `packages/perron/tokens/base.tokens.json:1163` `size.input` is still described as "Search field", but the contract's Families text and TextField's Tokens table use it as the height of every field. The description could be widened through the `design-tokens` skill.
- **P3-4.** `packages/perron/src/components/TextField/TextField.css:41` The CSS has no `appearance` or opacity override, so iOS Safari's own styles for inputs (an inset shadow, and dimmed text on a disabled input) may still apply. That would break the contract's CSS rule "Disabled is a colour, never an opacity". No WebKit is installed here, so this is unverified, and the Fields family may want a rule for it.
