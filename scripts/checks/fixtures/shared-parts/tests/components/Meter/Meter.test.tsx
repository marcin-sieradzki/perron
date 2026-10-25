// Declares `part`, which Gauge's unit test copies under another name.

/** The opening tag of the element whose class is `name`. */
export const part = (markup: string, name: string) =>
  markup.match(new RegExp(`<[^>]*class="${name}"[^>]*>`))?.[0] ?? ''
