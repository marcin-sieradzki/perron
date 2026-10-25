import { describe, expect, it } from 'vitest'
import check, { pointerProblems } from './pointer-feedback.ts'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const lint = (css: string) => pointerProblems('X.css', css).map((p) => p.message)

const BASE = `.pn-X { cursor: pointer; }
.pn-X[data-disabled] { cursor: default; }
`

describe('pointer-feedback', () => {
  it('passes a part that hovers, presses a step past it and takes the pointer', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover:not([data-disabled]) { background-color: var(--a-hover); } }
.pn-X:active:not([data-disabled]) { background-color: var(--a-pressed); }`),
    ).toEqual([])
  })

  it('fails a hover with no press, a press equal to it, and a press written before it', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }`),
    ).toEqual([expect.stringMatching(/has a hover look and no pressed one/)])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }
.pn-X:active { background-color: var(--a-hover); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
    expect(
      lint(`${BASE}
.pn-X:active { background-color: var(--a-pressed); }
@media (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }`),
    ).toEqual([expect.stringMatching(/comes before a hover rule/)])
  })

  it('fails a press that repeats part of the hover, and passes one that changes a paint of it', () => {
    const hover = `@media (hover: hover) {
  .pn-X:not([data-a], [data-b]):hover { background-color: var(--a-hover); color: var(--ink); }
}`
    expect(
      lint(`${BASE}${hover}
.pn-X:not([data-a], [data-b]):active { color: var(--ink); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
    expect(
      lint(`${BASE}${hover}
.pn-X:not([data-a], [data-b]):active { background-color: var(--a-pressed); color: var(--ink); }`),
    ).toEqual([])
  })

  it('matches a wrapped selector, merges a split press and fails an edge-only press that repeats', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) {
  .pn-X:not(
      [data-disabled],
      [data-readonly]
    ):hover { background-color: var(--a-hover); }
}
.pn-X:not([data-disabled], [data-readonly]):active { background-color: var(--a-pressed); }
.pn-X:not([data-disabled], [data-readonly]):active { transform: scale(0.98); }`),
    ).toEqual([])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { border-color: var(--a); } }
.pn-X:active { border-color: var(--a); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
  })

  it('reads a hover or a press split over rules as one, and a guard as no pinned edge', () => {
    const split = `${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a); } }
.pn-X:active { background-color: var(--b); }
@media (hover: hover) { .pn-X:hover { color: var(--c); } }`
    expect(lint(split)).toEqual([])
    expect(lint(`${split}\n.pn-X:active { background-color: var(--a); color: var(--c); }`)).toEqual(
      [expect.stringMatching(/paints only what its hover rule already paints/)],
    )
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { color: var(--a); } }
.pn-X:active { background: var(--b); }
@media (hover: hover) { .pn-X:hover { background-color: var(--b); } }`),
    ).toEqual([expect.stringMatching(/comes before a hover rule/)])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:not([data-invalid],[data-a]):hover { background-color: var(--a); } }
.pn-X:not([data-invalid], [data-a]):active { background-color: var(--a); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
  })

  it('reads a state outside its guards: a hover that leaves out the press, and a rest rule', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover:not(:active) { background-color: var(--a); } }`),
    ).toEqual([expect.stringMatching(/has a hover look and no pressed one/)])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover:not(:active) { background-color: var(--a); } }
.pn-X:active { background-color: var(--b); }
.pn-X:not(:hover) { color: var(--c); }
@media (hover: hover) and (not (pointer: coarse)) { .pn-X[data-y]:hover { color: var(--a); } }
.pn-X[data-y]:active { color: var(--b); }`),
    ).toEqual([])
  })

  it('reads a background shorthand as the fill and the layer it resets', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { color: var(--a); } }
.pn-X:active { background: var(--b); }
@media (hover: hover) { .pn-X:hover { background-image: linear-gradient(var(--c), var(--c)); } }`),
    ).toEqual([expect.stringMatching(/comes before a hover rule/)])
  })

  it('pairs guards written either side of the state, and reads the last of a split press', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:not([data-a]):hover { background-color: var(--a); } }
.pn-X:active:not([data-a]) { background-color: var(--b); }`),
    ).toEqual([])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a); } }
.pn-X:active { background-color: var(--b); }
@media (hover: hover) { .pn-X:hover { background-color: var(--a); } }
.pn-X:active { background-color: var(--b); }`),
    ).toEqual([])
  })

  it('reads an edge side, an outline and a query list as the rule means them', () => {
    expect(
      lint(`${BASE}
@media (hover: hover), not print { .pn-X:hover { border-block-end-color: var(--a); } }
.pn-X:active { outline: 2px solid var(--b); }`),
    ).toEqual([])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a); } }
.pn-X:active { background: var(--a); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
  })

  it('pairs across combinator spacing, reads (hover) and nested guards, and skips a hover that paints nothing', () => {
    expect(
      lint(`${BASE}
@media (hover) { .pn-Y>.pn-X:hover { background-color: var(--a); } }
.pn-Y > .pn-X:active { background-color: var(--b); }
.pn-X:not(:is(:hover, :focus)) { color: var(--c); }
@media (hover: hover) { .pn-X:hover .pn-X-tip { visibility: visible; } }
.pn-X[aria-disabled='false'] { color: var(--c); }`),
    ).toEqual([])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:is(:hover, :focus-visible) { background-color: var(--a); } }`),
    ).toEqual([expect.stringMatching(/hovers inside :is\(\) or :where\(\)/)])
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { border-color: var(--a); } }
.pn-X:active { border: 1px solid var(--a); }`),
    ).toEqual([expect.stringMatching(/paints only what its hover rule already paints/)])
  })

  it('fails a hover outside (hover: hover)', () => {
    expect(
      lint(`${BASE}
.pn-X:hover { background-color: var(--a-hover); }
.pn-X:active { background-color: var(--a-pressed); }`),
    ).toEqual([expect.stringMatching(/hovers outside @media \(hover: hover\)/)])
    expect(
      lint(`${BASE}
@media not all and (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }
.pn-X:active { background-color: var(--a-pressed); }`),
    ).toEqual([expect.stringMatching(/hovers outside @media \(hover: hover\)/)])
  })

  it('lets a pair that keeps an edge alone match, leaving the fill to the rules above it', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }
.pn-X:active { background-color: var(--a-pressed); }
@media (hover: hover) { .pn-X[data-invalid]:hover { border-color: var(--danger); } }
.pn-X[data-invalid]:active { border-color: var(--danger); }`),
    ).toEqual([])
  })

  it('reads no press in (hover: hover) or forced colours', () => {
    expect(
      lint(`${BASE}
@media (hover: hover) { .pn-X:hover { color: var(--a); } .pn-X:active { color: var(--b); } }
@media (forced-colors: active) { .pn-X:active { color: Highlight; } }`),
    ).toEqual([expect.stringMatching(/no pressed one/)])
  })

  it('asks the hovered part for the pointer, and the default cursor when disabled', () => {
    const pair = `@media (hover: hover) { .pn-X:not([data-disabled], [data-readonly]):hover { color: var(--a); } }
.pn-X:not([data-disabled], [data-readonly]):active { color: var(--b); }`
    expect(lint(`.pn-X[data-disabled] { color: var(--t); }\n${pair}`)).toEqual([
      expect.stringMatching(/\.pn-X styles a disabled state that keeps the pointer/),
      expect.stringMatching(/\.pn-X has a hover look and no cursor: pointer/),
    ])
    // another part's pointer, or a cursor the contract does not name, does not count
    expect(
      lint(`.pn-X-label { cursor: pointer; }
.pn-X { cursor: pointer; }
.pn-X[data-disabled] { cursor: not-allowed; }
${pair}`),
    ).toEqual([expect.stringMatching(/keeps the pointer: set cursor: default/)])
    expect(lint(`.pn-X-label { cursor: pointer; }\n${pair}`)).toEqual([
      expect.stringMatching(/no cursor: pointer/),
    ])
    // a child's pointer is not the part's, and a guarded disabled state still needs the default
    expect(
      lint(`.pn-X .pn-X-icon { cursor: pointer; }
.pn-X[data-disabled]:not([data-pressed]) { color: var(--t); }
${pair}`),
    ).toEqual([
      expect.stringMatching(/keeps the pointer/),
      expect.stringMatching(/no cursor: pointer/),
    ])
    // an attribute with a space or ~= in it, and an element hovered inside a part
    for (const hovered of [".pn-Y[data-x~='a b']", '.pn-Y button'])
      expect(
        lint(`@media (hover: hover) { ${hovered}:hover { color: var(--a); } }
${hovered}:active { color: var(--b); }`),
      ).toEqual([expect.stringMatching(/no cursor: pointer/)])
    // each still state takes the default cursor of its own
    expect(
      lint(`.pn-X { cursor: pointer; }
.pn-X[data-disabled] { cursor: default; }
.pn-X[data-readonly] { color: var(--t); }
${pair}`),
    ).toEqual([expect.stringMatching(/styles a read-only state that keeps the pointer/)])
    // an ARIA or valued state is a state, and a pseudo-element's or a focus rule's cursor is not the part's
    expect(
      lint(`.pn-X::before { cursor: pointer; }
.pn-X:focus-visible { cursor: pointer; }
.pn-X[aria-disabled='true'] { cursor: not-allowed; }
.pn-X[aria-disabled='true']:focus { cursor: default; }
${pair}`),
    ).toEqual([
      expect.stringMatching(/styles a disabled state that keeps the pointer/),
      expect.stringMatching(/no cursor: pointer/),
    ])
    // a cursor rule with a bracket or a formula in it, and an attribute that only starts like a state
    expect(
      lint(`.pn-X[data-k~='a b'] { cursor: pointer; }
.pn-X:nth-child(2n + 1)[data-disabled] { cursor: default; }
.pn-X[data-readonly-reason] { color: var(--t); }
${pair}`),
    ).toEqual([])
    // the row that holds a part sets its cursor in its own file
    expect(
      lint(`@media (hover: hover) { [role]:hover > .pn-X { color: var(--a); } }
[role]:active > .pn-X { color: var(--b); }`),
    ).toEqual([])
  })

  it("takes an allowance on any of a split hover's rules", () => {
    expect(
      lint(`@media (hover: hover) { .pn-X:hover { color: var(--a); } }
@media (hover: hover) {
  /* perron-allow(pointer-feedback): a text box takes the focus ring on press */
  .pn-X:hover { background-color: var(--b); }
}`),
    ).toEqual([])
  })

  it('takes an allowance on the hover rule, which leaves the cursor alone too', () => {
    expect(
      lint(`.pn-X[data-disabled] { color: var(--t); }
@media (hover: hover) {
  /* perron-allow(pointer-feedback): a text box takes the focus ring on press */
  .pn-X:hover { background-image: var(--a); }
}
.pn-X:active { background-image: var(--a); }`),
    ).toEqual([])
  })

  it('finds nothing in the repo', () => {
    expect(check.run(root)).toEqual([])
  })
})
