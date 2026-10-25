import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import docs from './docs.ts'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => join(here, 'fixtures/docs', name)

describe('docs', () => {
  it('passes a spec page from building on and a docs page from stable on', () => {
    // a stable Button with both, a building DepartureRow with its spec alone, a designing Dialog
    expect(docs.run(fixture('complete'))).toEqual([])
  })

  it('names a building entry without its spec page, and a stable one without its docs page', () => {
    expect(docs.run(fixture('missing'))).toEqual([
      {
        file: 'docs/components/date-picker.md',
        message: 'DatePicker is building and has no spec page; copy docs/components/TEMPLATE.md',
      },
      {
        file: 'packages/perron/src/components/Button/Button.mdx',
        message: 'Button is stable and has no docs page; the component-docs skill writes it',
      },
    ])
  })

  it("names a building entry whose code the docs page's docgen reads no props from", () => {
    // Tag returns useRender(...) and is read; Blank takes no props
    expect(docs.run(fixture('docgen'))).toEqual([
      {
        file: 'packages/perron/src/components/Blank/Blank.tsx',
        message:
          "Blank's docs page would show no props: its docgen finds no exported function component Blank taking BlankProps",
      },
    ])
  })

  it('names a prop whose default the docs page would not show as the spec gives it', () => {
    // Flag's variant, render and closedLabel show theirs; openLabel has no @default
    expect(docs.run(fixture('defaults'))).toEqual([
      {
        file: 'packages/perron/src/components/Flag/Flag.tsx',
        message:
          "Flag's docs page would show no default for openLabel, where docs/components/flag.md:13 gives \"The locale's\": give it as the destructuring default or as `@default The locale's` in its JSDoc",
      },
    ])
  })

  it("names a member the spec's Props table has no row for, and a row with no member", () => {
    // Note inherits render from Base UI, which its spec leaves out; its spec's tone is no member
    expect(docs.run(fixture('rows'))).toEqual([
      {
        file: 'docs/components/note.md',
        message:
          "Note's docs page would show render, which docs/components/note.md's Props table has no row for: give it a row, as for every member of NoteProps, those inherited from Base UI and React's `className`, `style` and `ref` included, which the component does not declare again",
      },
      {
        file: 'docs/components/note.md',
        line: 10,
        message:
          "tone is a row of docs/components/note.md's Props table but no member of NoteProps, so the docs page would leave it out: give NoteProps the member, or take the row out",
      },
    ])
  })

  it("names a story the spec's Stories table has no row for, and a row no story is", () => {
    expect(docs.run(fixture('stories'))).toEqual([
      {
        file: 'docs/components/pin.md',
        message:
          "packages/perron/src/components/Pin/Pin.stories.tsx exports the story Small, which docs/components/pin.md's Stories table has no row for: give it a row, or take the story out",
      },
      {
        file: 'docs/components/pin.md',
        line: 11,
        message:
          "Large is a row of docs/components/pin.md's Stories table but no story packages/perron/src/components/Pin/Pin.stories.tsx exports: export it under that name, or take the row out",
      },
    ])
  })

  it('names an overlay no story opens by defaultOpen, and an intro that shows run notes', () => {
    expect(docs.run(fixture('overlay'))).toEqual([
      {
        file: 'docs/components/popup.md',
        line: 3,
        message:
          'Popup\'s docs page would open with run notes ("ADR 0010"): move how the spec was made below a `<!-- run notes -->` line after the intro\'s sentence (docs/components/TEMPLATE.md)',
      },
      {
        file: 'packages/perron/src/components/Popup/Popup.stories.tsx',
        message:
          "Popup is an overlay, with open and defaultOpen, but no story opens it by defaultOpen, so its docs page and the visual stage show it closed: open each story by defaultOpen beside the trigger that opens it again (the contract's Stories), and give docs/components/popup.md's Stories rows the same",
      },
    ])
  })

  // the docgen of every component in the repo, which outruns the default 5 s on a CI runner
  it('passes on the repo', () => {
    expect(docs.run(join(here, '../..'))).toEqual([])
  }, 30_000)
})
