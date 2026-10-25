// The previews registry: each component's and pattern's preview by its registry name, drawn with
// the shipped component itself. components.tsx (ticket T5) and patterns.tsx (ticket T6) fill it;
// every page draws a preview through getPreview, so a page never imports a preview file directly.
// Both files are server modules: they import Perron from '@mylder/perron', whose components arrive
// as client references, and a preview that needs state or handlers is a 'use client' component of
// its own.
import type { ReactNode } from 'react'
import { compactProps, componentPreviews } from './components.tsx'
import { patternPreviews } from './patterns.tsx'

/** Props a page passes a preview to pick a variant or state, such as `{ variant: 'outline' }`. */
export type PreviewProps = Record<string, unknown>

/** Draws one preview. */
export type Preview = (props?: PreviewProps) => ReactNode

/** Previews by registry name, such as `Button` or `DetailPanel`. */
export type Previews = Record<string, Preview>

function find(name: string): Preview | undefined {
  if (Object.hasOwn(componentPreviews, name)) return componentPreviews[name]
  if (Object.hasOwn(patternPreviews, name)) return patternPreviews[name]
  return undefined
}

/** Whether an entry has a preview yet. */
export const hasPreview = (name: string) => find(name) !== undefined

/** The props that draw an entry's preview small enough to repeat in a row, or none. */
export const compactPreviewProps = (name: string): PreviewProps =>
  Object.hasOwn(compactProps, name) ? compactProps[name] : {}

/** The preview of the entry named `name`, drawn with `props`, or null when it has none. */
export function getPreview(name: string, props?: PreviewProps): ReactNode | null {
  const preview = find(name)
  return preview ? preview(props) : null
}
