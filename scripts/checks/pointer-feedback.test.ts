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
    ).toEqual([expect.stringMatching(/paints what its hover rule paints/)])
    expect(
      lint(`${BASE}
.pn-X:active { background-color: var(--a-pressed); }
@media (hover: hover) { .pn-X:hover { background-color: var(--a-hover); } }`),
    ).toEqual([expect.stringMatching(/comes before its hover rule/)])
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

  it('asks a file that hovers its own part for the pointer, and the default cursor when disabled', () => {
    const css = `.pn-X[data-disabled] { color: var(--t); }
@media (hover: hover) { .pn-X:hover { color: var(--a); } }
.pn-X:active { color: var(--b); }`
    expect(lint(css)).toEqual([
      expect.stringMatching(/sets no cursor: pointer/),
      expect.stringMatching(/a disabled part keeps the pointer/),
    ])
    // the row that holds a part sets its cursor in its own file
    expect(
      lint(`@media (hover: hover) { [role]:hover > .pn-X { color: var(--a); } }
[role]:active > .pn-X { color: var(--b); }`),
    ).toEqual([])
  })

  it('takes an allowance on the hover rule', () => {
    expect(
      lint(`@media (hover: hover) {
  /* perron-allow(pointer-feedback): a text box takes the focus ring on press */
  .pn-X:hover { background-image: var(--a); }
}`),
    ).toEqual([])
  })

  it('finds nothing in the repo', () => {
    expect(check.run(root)).toEqual([])
  })
})
