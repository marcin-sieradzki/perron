// How list_components ranks the entries a query finds, on hand-built records, so a spec's wording
// never decides whether the rules hold.
import { describe, expect, it } from 'vitest'
import { type ComponentRecord, listComponents } from './components.ts'

/** A record with only what the search reads: its name, category, summary and when to use it. */
const record = (name: string, summary: string, whenToUse = ''): ComponentRecord => ({
  name,
  layer: 'component',
  category: 'Inputs',
  status: 'stable',
  summary,
  import: '',
  whenToUse,
  alternatives: [],
  props: [],
  rules: [],
  agentNotes: [],
  docs: '',
})

const names = (found: ComponentRecord[]) => found.map((r) => r.name)

describe('listComponents', () => {
  it('puts an entry holding a rare word of the query before one holding a common word', () => {
    const records = [
      record('Alpha', 'Sets a value.'),
      record('Beta', 'Sets a value.'),
      record('Gamma', 'Sets a value.'),
      record('Delta', 'Flips a toggle.'),
    ]
    expect(names(listComponents(records, 'value toggle'))).toEqual([
      'Delta',
      'Alpha',
      'Beta',
      'Gamma',
    ])
  })

  it('breaks a tie with a word of the name', () => {
    const records = [record('Toggle', 'A switch.'), record('Switch', 'Turns it on.')]
    expect(names(listComponents(records, 'switch'))).toEqual(['Switch', 'Toggle'])
  })

  it('keeps the registry order between entries that match alike', () => {
    const records = [record('Alpha', 'A toggle.'), record('Beta', 'A toggle.')]
    expect(names(listComponents(records, 'toggle'))).toEqual(['Alpha', 'Beta'])
  })

  it('ignores the filler words of a question', () => {
    const records = [record('Alpha', 'What it is for, and how.'), record('Beta', 'Flips a toggle.')]
    expect(names(listComponents(records, 'what is a toggle for'))).toEqual(['Beta'])
  })

  it('finds a word in when to use the entry, and a plural as its singular', () => {
    const records = [record('Alpha', 'A box.', 'Use it for one setting.'), record('Beta', 'A box.')]
    expect(names(listComponents(records, 'settings'))).toEqual(['Alpha'])
  })
})
