// Helpers the stories share, written once here (docs/components/README.md, "Shared helpers").
import { createElement, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { holds, isPaint } from './pointer.ts'
import type { VehicleDotProps } from '../components/VehicleDot/VehicleDot.tsx'

/** An icon file from packages/perron/icons, as its `?raw` text, inline, sized by `.perron-icon`. */
export const icon = (svg: string) =>
  createElement('span', {
    style: { display: 'contents' },
    dangerouslySetInnerHTML: { __html: svg.replace('<svg ', '<svg class="perron-icon" ') },
  })

/**
 * The style of one typography role with its `-tracking` twin, for a story's own text, with no
 * margin, so a `<p>` or a heading sits where the layout puts it.
 */
export const typography = (role: string): CSSProperties => ({
  font: `var(--perron-typography-${role})`,
  letterSpacing: `var(--perron-typography-${role}-tracking)`,
  margin: 0,
})

/**
 * What a screen reader reads of `element`: its text outside `aria-hidden`, its white space
 * collapsed. For a part with no role and no name of its own, where the accessibility tree adds
 * nothing to its text.
 */
export function heard(element: Element) {
  const copy = element.cloneNode(true) as Element
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return copy.textContent!.replace(/\s+/g, ' ').trim()
}

/**
 * The value a token renders as here, read from a probe that sets it on `property`. A colour read
 * as `color` is `colour`'s. The probe's border and outline are solid, so a width read as
 * `border-width` or `outline-width` shows rather than computing to `0px`.
 */
export function rendered(token: string, property: string) {
  const probe = document.createElement('div')
  probe.style.borderStyle = 'solid'
  probe.style.outlineStyle = 'solid'
  probe.style.setProperty(property, `var(--perron-${token})`)
  document.body.append(probe)
  const value = getComputedStyle(probe).getPropertyValue(property)
  probe.remove()
  return value
}

/** A property of an element's inline style that takes a string, such as `backgroundColor`. */
type StyleProperty = {
  [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never
}[keyof CSSStyleDeclaration] &
  string

/**
 * A value, such as `var(--perron-color-border-focus)`, as it renders on `property`: read from a
 * block probe with a solid border and outline, so a border colour or an outline width shows.
 */
export function resolve(property: StyleProperty, value: string) {
  const probe = document.createElement('span')
  probe.style.display = 'block'
  probe.style.borderStyle = 'solid'
  probe.style.outlineStyle = 'solid'
  probe.style[property] = value
  document.body.append(probe)
  const rendered = getComputedStyle(probe)[property]
  probe.remove()
  return rendered
}

/**
 * `selector` with each `pseudo` in it made to match any element, `:is(*)`, so the selector matches
 * an element at rest wherever the state is written: after a compound (`.a:hover > .b`), alone
 * (`:hover > .b`) or inside `:not()`. Taking the pseudo-class out would leave the last two invalid.
 */
export const withoutState = (selector: string, pseudo: string) =>
  selector.replaceAll(pseudo, ':is(*)')

/** The query of the rules that reset a state for forced colours, which a story never renders in. */
const FORCED_COLORS = '(forced-colors: active)'

/** A rule as `stateRulesIn` reads it: a media rule's query and rules, or a style rule. */
export interface SheetRule {
  /** A media rule's query, such as `(hover: hover)` */
  conditionText?: string
  /** A media rule's own rules */
  cssRules?: ArrayLike<SheetRule>
  /** A style rule's selector */
  selectorText?: string
  /** A style rule's declarations */
  style?: CSSStyleDeclaration
}

/**
 * The declarations a state adds to `element` in `sheets`: each style rule whose selector holds
 * `pseudo` and, without it, matches the element; for `:hover`, only the rules inside
 * `(hover: hover)`, at any depth; and never the rules inside `(forced-colors: active)`, the reset
 * a story's browser doesn't apply. `stateRules` reads the document's sheets with it.
 */
export function stateRulesIn(
  sheets: ArrayLike<{ cssRules: ArrayLike<SheetRule> }>,
  element: { matches(selector: string): boolean },
  pseudo: ':hover' | ':active' | ':visited' = ':hover',
) {
  const found: CSSStyleDeclaration[] = []
  const visit = (rules: ArrayLike<SheetRule>, inQuery: boolean) => {
    for (const rule of Array.from(rules))
      if (rule.conditionText !== undefined && rule.cssRules) {
        if (!holds(rule.conditionText, FORCED_COLORS))
          visit(rule.cssRules, inQuery || holds(rule.conditionText, '(hover: hover)'))
      } else if (
        rule.selectorText !== undefined &&
        rule.style &&
        (pseudo !== ':hover' || inQuery) &&
        rule.selectorText.includes(pseudo) &&
        element.matches(withoutState(rule.selectorText, pseudo))
      )
        found.push(rule.style)
  }
  for (const sheet of Array.from(sheets)) visit(sheet.cssRules, false)
  return found
}

/**
 * The declarations a state adds to `element`, by `stateRulesIn` over the document's sheets. A
 * script's events can't set `:hover`, `:active` or `:visited`, so this reads the rules the browser
 * would apply; the visual stage drives the states for real.
 */
export const stateRules = (
  element: Element,
  pseudo: ':hover' | ':active' | ':visited' = ':hover',
) =>
  stateRulesIn(
    document.styleSheets as ArrayLike<{ cssRules: ArrayLike<SheetRule> }>,
    element,
    pseudo,
  )

/**
 * Whether `element` has a `(hover: hover)` rule and an `:active` rule that paint it, as the
 * pointer-feedback check reads paint (pointer.ts), and the last `:active` one, outside the query,
 * comes after the last hover one in source order. Forced colours' rules are left out, as they
 * replace both. The contract's selectors make the two as specific, so the later one wins while a
 * mouse presses, and a press written first shows the hover look.
 */
export function pressedAfterHover(element: Element) {
  let [index, hover, active] = [0, -1, -1]
  // a var() shorthand still lists its longhands, empty, so `background: var(…)` counts as paint
  const paints = (style: CSSStyleDeclaration) => Array.from(style).some(isPaint)
  const visit = (rules: CSSRuleList, inQuery: boolean) => {
    for (const rule of Array.from(rules))
      if (rule instanceof CSSMediaRule) {
        if (!holds(rule.conditionText, FORCED_COLORS))
          visit(rule.cssRules, inQuery || holds(rule.conditionText, '(hover: hover)'))
      } else if (rule instanceof CSSGroupingRule && !(rule instanceof CSSStyleRule))
        visit(rule.cssRules, inQuery)
      else if (rule instanceof CSSStyleRule && paints(rule.style)) {
        index++
        const text = rule.selectorText
        if (inQuery && text.includes(':hover') && element.matches(withoutState(text, ':hover')))
          hover = index
        // outside the query, so a touch press shows too
        if (!inQuery && text.includes(':active') && element.matches(withoutState(text, ':active')))
          active = index
      }
  }
  for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules, false)
  return hover >= 0 && active > hover
}

/**
 * The fill a rule's declarations give, as written: its `background-color`, or else the colour of
 * its `background` shorthand, whose longhands the CSSOM leaves empty when the shorthand holds a
 * `var()`; '' for none, for a shorthand with no colour (`background: none`), or for one that
 * draws a gradient or an image.
 */
export function fillOf(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>) {
  const color = style.getPropertyValue('background-color').trim()
  if (color) return color
  const short = style.getPropertyValue('background').trim()
  if (!short || /gradient\(|url\(/i.test(short)) return ''
  // the colour is the shorthand's last var(), hex, colour function or keyword
  const colours = short.match(
    /var\((?:[^()]|\([^()]*\))*\)|#[\da-f]+\b|\b(?:rgba?|hsla?|oklch|oklab|color-mix)\((?:[^()]|\([^()]*\))*\)|\b(?:transparent|currentcolor)\b/gi,
  )
  return colours?.at(-1) ?? ''
}

/** The background a state's rules give `element` last, as written, or '' when none sets one. */
export const stateFill = (element: Element, pseudo: ':hover' | ':active' = ':hover') =>
  stateRules(element, pseudo).map(fillOf).filter(Boolean).at(-1) ?? ''

/** The last background layer a state's rules give `element`, as written, or '' when none does. */
export const stateLayer = (element: Element, pseudo: ':hover' | ':active' = ':hover') =>
  stateRules(element, pseudo)
    .map((s) => s.getPropertyValue('background-image'))
    .filter(Boolean)
    .at(-1) ?? ''

/**
 * What the `(hover: hover)` rules set `property` to when `element` is hovered, as written. A
 * synthetic pointer doesn't reach `:hover`, so this reads the rule the real pointer would apply.
 */
export function onHover(element: Element, property: string) {
  let value = ''
  for (const sheet of Array.from(document.styleSheets))
    for (const rule of Array.from(sheet.cssRules))
      if (rule instanceof CSSMediaRule && holds(rule.conditionText, '(hover: hover)'))
        for (const inner of Array.from(rule.cssRules))
          if (
            inner instanceof CSSStyleRule &&
            inner.selectorText.includes(':hover') &&
            element.matches(withoutState(inner.selectorText, ':hover'))
          )
            value = inner.style.getPropertyValue(property) || value
  return value
}

/**
 * A colour custom property, such as `--perron-color-text-secondary`, as it renders: the computed
 * `color` of a probe that reads it, to compare with an element's computed colour.
 */
export function colour(property: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${property})`
  document.body.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value
}

/**
 * A router's link component as a stand-in, for a `render` prop: an `<a>` that brings its own
 * destination, `to`, as its `href`, marked `data-router-link`, with the rest of its props, `ref`
 * among them, on the `<a>`.
 */
export const RouterLink = ({ to, ...rest }: ComponentProps<'a'> & { to: string }) =>
  createElement('a', { ...rest, href: to, 'data-router-link': '' })

/**
 * Renders `ui` apart from the story, into a host appended to `parent`, runs `test` on the host,
 * and unmounts and removes the host after, whether `test` passes or throws.
 */
export async function mounted<T>(
  parent: HTMLElement,
  ui: ReactNode,
  test: (host: HTMLElement) => Promise<T>,
): Promise<T> {
  const host = document.createElement('div')
  parent.append(host)
  const root = createRoot(host)
  root.render(ui)
  try {
    return await test(host)
  } finally {
    root.unmount()
    host.remove()
  }
}

/**
 * Resolves once nothing with `role` is open, a dialog by default; or, given `{ selector }`, once no
 * element matches it, for a popup that leaves the document as it closes.
 */
export const closed = (what: string | { selector: string } = 'dialog') =>
  waitFor(() =>
    expect(
      typeof what === 'string' ? screen.queryByRole(what) : document.querySelector(what.selector),
    ).toBeNull(),
  )

/** The element with `data-testid` `id`, once it has rendered. */
export const byTestId = (id: string) =>
  waitFor(() => {
    const found = document.querySelector(`[data-testid="${id}"]`)
    expect(found).not.toBeNull()
    return found as HTMLElement
  })

/** Resolves after the given number of frames, for a check that something has not changed. */
export const frames = async (count: number) => {
  for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame)
}

/** How many lines tall `element` is, in its own line height. */
export const lines = (element: Element) =>
  element.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(element).lineHeight)

/** A colour or other token, by its custom property's name without `--perron-`, as a fill renders it. */
export const fill = (token: string) => resolve('backgroundColor', `var(--perron-${token})`)

/**
 * A colour token, by its custom property's full name without `--perron-`, such as
 * `'color-border-control'`, as an edge renders it, to
 * compare with an element's `border-color` or `outline-color`.
 */
export const edge = (token: string) => resolve('borderColor', `var(--perron-${token})`)

/**
 * One of Field's parts in `scope`, by its class: the frame, `pn-Field`, or an inner part, such as
 * `pn-Field-label`; null when it isn't rendered. For Field and the controls it frames.
 */
export const fieldPart = (
  scope: Element,
  name: 'field' | 'label' | 'optional' | 'description' | 'error',
) => scope.querySelector<HTMLElement>(name === 'field' ? '.pn-Field' : `.pn-Field-${name}`)

/** The close button of an open popup, by its name, once Base UI has moved focus to it. */
export async function focusedClose(popup: HTMLElement, name = 'Close') {
  const close = within(popup).getByRole('button', { name })
  await waitFor(() => expect(close).toHaveFocus())
  return close
}

/** Tabs once and expects focus to land nowhere inside `root`, then tabs back. */
export async function expectNoFocus(root: HTMLElement) {
  await userEvent.tab()
  await expect(root.contains(document.activeElement)).toBe(false)
  await userEvent.tab({ shift: true })
}

/**
 * Runs `test` with a button placed just before `canvas` and focused, so the next Tab reaches the
 * story's first focusable element and Shift+Tab from it lands back on the button; removes the
 * button after, whether `test` passes or throws.
 */
async function fromButtonBefore(canvas: HTMLElement, test: (before: HTMLElement) => Promise<void>) {
  const before = document.createElement('button')
  before.textContent = 'Before the story'
  canvas.before(before)
  before.focus()
  try {
    await test(before)
  } finally {
    before.remove()
  }
}

/**
 * A link's keys, from a button placed before the story: Tab focuses `link`, Enter fires `onClick`
 * once, Space fires nothing, and Shift+Tab moves focus back to the button, the element before it.
 */
export const expectFollows = (canvas: HTMLElement, link: HTMLElement, onClick: unknown) =>
  fromButtonBefore(canvas, async (before) => {
    await userEvent.tab()
    await expect(link).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    await expect(onClick).toHaveBeenCalledTimes(1)
    await userEvent.tab({ shift: true })
    await expect(before).toHaveFocus()
  })

/**
 * From a button placed before the story, Tab gives `element` `:focus-visible` and the ring
 * perron.css draws, and Shift+Tab moves focus back to the button, the element before it.
 */
export const expectFocusRing = (canvas: HTMLElement, element: HTMLElement) =>
  fromButtonBefore(canvas, async (before) => {
    await userEvent.tab()
    await expect(element).toHaveFocus()
    await expect(element.matches(':focus-visible')).toBe(true)
    const ring = getComputedStyle(element)
    await expect(ring.outlineStyle).toBe('solid')
    await expect(ring.outlineColor).toBe(edge('color-border-focus'))
    await expect(ring.outlineWidth).toBe(resolve('outlineWidth', 'var(--perron-focus-width)'))
    await expect(ring.outlineOffset).toBe(resolve('outlineOffset', 'var(--perron-focus-offset)'))
    await userEvent.tab({ shift: true })
    await expect(before).toHaveFocus()
  })

/**
 * Every `(forced-colors: active)` rule in the document's sheets whose selector names one of
 * `classes`, such as `'pn-VehicleDot'`, or one of its parts' (`.pn-VehicleDot` and
 * `.pn-VehicleDot-dot`, never `.pn-VehicleDotLegend`), unwrapped into a sheet of its own, in source
 * order. A play test cannot turn forced colours on, so it adopts this sheet while it runs and takes
 * it off after.
 */
export function forcedColourSheet(...classes: string[]) {
  const names = classes.map((name) => new RegExp(`\\.${name}(?!\\w)`))
  const found: string[] = []
  const visit = (rules: CSSRuleList, forced: boolean) => {
    for (const rule of Array.from(rules))
      if (rule instanceof CSSMediaRule)
        visit(rule.cssRules, forced || holds(rule.conditionText, FORCED_COLORS))
      else if (
        forced &&
        rule instanceof CSSStyleRule &&
        names.some((name) => name.test(rule.selectorText))
      )
        found.push(rule.cssText)
  }
  for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules, false)
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(found.join('\n'))
  return sheet
}

/**
 * A VehicleDot's root has exactly the no-signal cut, `vehicle-dot.no-signal.cut-width` wide unless
 * `width` says otherwise: a gradient towards the bottom left, whose 50% line runs from the top left
 * of the glyph box to the bottom right, opaque in the root's colour up to half a cut-width before
 * it and from half a cut-width after it, transparent between. The other diagonal, a gap of another
 * width or opaque stops in the gap all fail.
 */
export function expectVehicleDotCut(
  root: Element,
  width = rendered('vehicle-dot-no-signal-cut-width', 'stroke-width'),
) {
  const ink = getComputedStyle(root).color
  const cut = `linear-gradient(to bottom left, ${ink} calc(50% - ${width} / 2), transparent calc(50% - ${width} / 2), transparent calc(50% + ${width} / 2), ${ink} calc(50% + ${width} / 2))`
  return expect(getComputedStyle(root).maskImage).toBe(resolve('maskImage', cut))
}

/**
 * A VehicleDot's root shows `variant` in its own shape, drawn in `ink`, the colour its
 * `currentColor` takes: the fill and opacity, the rim, its width and its dash of its
 * `.pn-VehicleDot-dot`, and the root's cut, which only no signal has. No signal's dot fills with
 * `noSignalFill`, its grey outside forced colours and `ink` in them.
 */
export async function expectVehicleDotShape(
  root: Element,
  variant: NonNullable<VehicleDotProps['variant']>,
  ink: string,
  noSignalFill = ink,
) {
  await expect(root).toHaveAttribute('data-variant', variant)
  const style = getComputedStyle(root.querySelector('.pn-VehicleDot-dot')!)
  const width = (token: string) => rendered(`vehicle-dot-${token}-stroke-width`, 'stroke-width')
  if (variant === 'no-signal') {
    await expect(style.fill).toBe(noSignalFill)
    await expect(style.fillOpacity).toBe('1')
    await expect(style.stroke).toBe('none')
    await expectVehicleDotCut(root)
    return
  }
  await expect(getComputedStyle(root).maskImage).toBe('none')
  switch (variant) {
    case 'live':
      await expect(style.fill).toBe(ink)
      await expect(style.fillOpacity).toBe('1')
      await expect(style.stroke).toBe('none')
      break
    case 'ageing':
      await expect(style.fill).toBe(ink)
      await expect(style.fillOpacity).toBe(
        rendered('vehicle-dot-ageing-fill-opacity', 'fill-opacity'),
      )
      await expect(style.stroke).toBe(ink)
      await expect(style.strokeWidth).toBe(width('ageing'))
      await expect(style.strokeDasharray).toBe('none')
      break
    case 'estimated':
      await expect(style.fill).toBe('none')
      await expect(style.stroke).toBe(ink)
      await expect(style.strokeWidth).toBe(width('estimated'))
      await expect(style.strokeDasharray).toBe('none')
      break
    case 'timetable-only':
      await expect(style.fill).toBe('none')
      await expect(style.stroke).toBe(ink)
      await expect(style.strokeWidth).toBe(width('timetable'))
      await expect(style.strokeDasharray).toBe(
        rendered('vehicle-dot-timetable-dash', 'stroke-dasharray'),
      )
  }
}
