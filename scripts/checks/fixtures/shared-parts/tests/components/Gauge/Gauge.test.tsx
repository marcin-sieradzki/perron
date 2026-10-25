// Copies Meter's unit-test helper `part` as `tagOf`.

/** The opening tag of the element whose class is `cls`. */
export const tagOf = (html: string, cls: string) =>
  html.match(new RegExp(`<[^>]*class="${cls}"[^>]*>`))?.[0] ?? ''
