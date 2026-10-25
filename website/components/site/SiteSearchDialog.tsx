'use client'
// The docs search's dialog: Perron's Dialog, opened by the header's button or the / key, holding
// a SearchField and the results as links. ↓ in the field moves to the first result, the arrows move
// through them, Enter opens one (in the field, the first), and Esc closes the dialog, which gives
// focus back to the button. An empty query lists the sections.
import { Button, Dialog, Kbd, SearchField } from '@mylder/perron'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import type { SearchEntry } from '../../lib/search-index.ts'
import { SECTIONS } from './sections.ts'
import { searchEntries } from './SiteSearchMatch.ts'

export interface SiteSearchDialogProps {
  /** Every route's title and headings, from website/lib/search-index.ts */
  index: SearchEntry[]
  /** The button's words, the dialog's title and the field's name */
  label: string
  /** The search icon, rendered on the server */
  icon: ReactNode
}

/** The sections, as the results an empty query shows. */
const SECTION_ENTRIES: SearchEntry[] = SECTIONS.map((s) => ({
  title: s.label,
  href: s.href,
  section: s.label,
}))

const SECTION_HREFS = new Set(SECTIONS.map((s) => s.href))

/** Where focus is typing, or inside another dialog, so / is a character there, not the shortcut. */
const TYPING =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"]'

/** The line under a result: the page a heading is on, or the section a page is in. */
function contextOf(entry: SearchEntry) {
  if (entry.page) return entry.page
  return SECTION_HREFS.has(entry.href) ? undefined : entry.section
}

export function SiteSearchDialog({ index, label, icon }: SiteSearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const router = useRouter()

  const words = query.trim()
  const results = useMemo(() => searchEntries(index, words), [index, words])
  const shown = words ? results : SECTION_ENTRIES

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest(TYPING)) return
      event.preventDefault()
      setOpen(true)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const links = () => Array.from(listRef.current?.querySelectorAll('a') ?? [])

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const all = links()
      const to = event.key === 'ArrowDown' ? all[0] : all.at(-1)
      if (!to) return
      event.preventDefault()
      to.focus()
    } else if (event.key === 'Enter' && results[0]) {
      // the best match, once there are words to match
      event.preventDefault()
      router.push(results[0].href)
      close()
    }
  }

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const all = links()
    const at = all.findIndex((a) => a === document.activeElement)
    if (at < 0) return
    const to = {
      ArrowDown: all[Math.min(at + 1, all.length - 1)],
      ArrowUp: at === 0 ? inputRef.current : all[at - 1],
      Home: all[0],
      End: all.at(-1),
    }[event.key]
    if (!to) return
    event.preventDefault()
    to.focus()
  }

  const status = !words
    ? ''
    : results.length === 0
      ? `No page matches “${words}”.`
      : results.length === 1
        ? '1 result'
        : `${results.length} results`

  return (
    <Dialog
      title={label}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
      initialFocus={inputRef}
      className="site-search-dialog"
      trigger={
        <Button
          variant="outline"
          className="site-search"
          aria-label={label}
          aria-keyshortcuts="/"
          startIcon={icon}
          endIcon={<Kbd aria-hidden="true">/</Kbd>}
        >
          <span className="site-search-label">{label}</span>
        </Button>
      }
    >
      <search className="site-search-body">
        <SearchField
          label={label}
          hiddenLabel
          placeholder="Try a page or a heading, such as Sheet"
          items={[]}
          filter={null}
          open={false}
          value={query}
          onChange={(_event, value) => setQuery(value)}
          slotProps={{ input: { ref: inputRef, onKeyDown: onFieldKeyDown } }}
        />
        <div className="site-search-results">
          {words ? null : <h3 className="site-search-group">Sections</h3>}
          {/* one live region: the count, heard and not seen, or the miss, seen and heard */}
          <p
            role="status"
            className={words && !results.length ? 'site-search-empty' : 'site-visually-hidden'}
          >
            {status}
          </p>
          {shown.length ? (
            <ul ref={listRef} className="site-search-list" onKeyDown={onListKeyDown}>
              {shown.map((entry) => {
                const context = contextOf(entry)
                return (
                  <li key={`${entry.href} ${entry.title}`}>
                    <NextLink
                      href={entry.href}
                      className="site-search-result hover"
                      onClick={close}
                    >
                      <span className="site-search-result-title">{entry.title}</span>
                      {context ? (
                        <span className="site-search-result-context">{context}</span>
                      ) : null}
                    </NextLink>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
        <p className="site-search-keys">
          Keys: <Kbd>/</Kbd> opens the search, the arrows move through the results, <Kbd>Enter</Kbd>{' '}
          opens one, <Kbd>Esc</Kbd> closes the search.
        </p>
      </search>
    </Dialog>
  )
}
