# Typography

Three families, self-hosted. Familjen Grotesk is for headings and the wordmark, Schibsted Grotesk for text and labels, and JetBrains Mono for data. Fonts load from this package, never from Google Fonts, which would send visitors' IP addresses to Google.

## Roles

Sixteen roles, one per job. Set every piece of text with a role, either as a class (`perron-typography-body`) or as a composite custom property (`font: var(--perron-typography-body)` plus `letter-spacing: var(--perron-typography-body-tracking)`).

- Anything people compare down a column is a `data` role: times, countdowns, counts, delays, percentages. They use tabular figures, so columns line up.
- `overline` sets its text in capitals: the class adds `text-transform: uppercase`, and with the custom property you add it yourself. Write the source text in sentence case.
- On phones, `display` and `data-xl` step down to `font.size.800`, and `stat` to `font.size.600`. These are the only places a component reaches for a size directly.

<!-- tokens: typography.* -->

| Role                    | Family            | Weight | Size  | Line height | Tracking | Use                                                                         |
| ----------------------- | ----------------- | ------ | ----- | ----------- | -------- | --------------------------------------------------------------------------- |
| `typography.display`    | Familjen Grotesk  | 700    | 48 px | 1.15        | -0.96 px | Hero headline. Steps down to font.size.800 on phones.                       |
| `typography.heading-lg` | Familjen Grotesk  | 700    | 24 px | 1.15        | -0.48 px | Dialog and page titles                                                      |
| `typography.heading-md` | Familjen Grotesk  | 600    | 20 px | 1.15        | -0.3 px  | Panel titles: a stop or a destination. The wordmark is heading-md set bold. |
| `typography.heading-sm` | Schibsted Grotesk | 600    | 14 px | 1.3         | 0 px     | Card titles, such as a disruption                                           |
| `typography.body`       | Schibsted Grotesk | 400    | 14 px | 1.5         | 0 px     | Sentences and inputs                                                        |
| `typography.body-sm`    | Schibsted Grotesk | 400    | 13 px | 1.5         | 0 px     | Supporting sentences: the line under a title, disruption details            |
| `typography.caption`    | Schibsted Grotesk | 400    | 12 px | 1.5         | 0 px     | Notes, second lines in rows, legend descriptions, map credits               |
| `typography.label`      | Schibsted Grotesk | 600    | 13 px | 1.3         | 0 px     | Buttons, tabs, chips and names in lists                                     |
| `typography.label-sm`   | Schibsted Grotesk | 500    | 12 px | 1.3         | 0 px     | Legend items, field and stat labels, tooltips                               |
| `typography.overline`   | Schibsted Grotesk | 600    | 11 px | 1.3         | 0.88 px  | Section headings and tags, set in capitals                                  |
| `typography.badge`      | Schibsted Grotesk | 700    | 12 px | 1           | 0.12 px  | Line badge labels                                                           |
| `typography.stat`       | Schibsted Grotesk | 600    | 28 px | 1.15        | -0.84 px | Key figures. Steps down to font.size.600 on phones.                         |
| `typography.data-xl`    | JetBrains Mono    | 600    | 48 px | 1           | -1.92 px | Kiosk clock. Steps down to font.size.800 on phones.                         |
| `typography.data-lg`    | JetBrains Mono    | 600    | 16 px | 1.15        | 0 px     | Top bar clock, departure countdowns                                         |
| `typography.data`       | JetBrains Mono    | 500    | 12 px | 1.3         | 0 px     | Times, delays, counts and percentages in lists and tables                   |
| `typography.data-sm`    | JetBrains Mono    | 500    | 11 px | 1.3         | 0 px     | Counts in chips and tabs, chart axes, the time under a countdown            |

<!-- /tokens -->

## Families and weights

<!-- tokens: font.family.* font.weight.* -->

| Token                  | Value                                                                       | Use                                                                    |
| ---------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `font.family.display`  | `Familjen Grotesk, Schibsted Grotesk, system-ui, sans-serif`                | Display: headings and the wordmark                                     |
| `font.family.body`     | `Schibsted Grotesk, system-ui, -apple-system, Segoe UI, Roboto, sans-serif` | All interface text                                                     |
| `font.family.data`     | `JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace`         | Data: times, countdowns, counts and data ages. Always tabular figures. |
| `font.weight.regular`  | `400`                                                                       | Running text                                                           |
| `font.weight.medium`   | `500`                                                                       | Controls, list titles, data                                            |
| `font.weight.semibold` | `600`                                                                       | Labels, titles, stats                                                  |
| `font.weight.bold`     | `700`                                                                       | Display titles, wordmark, line badges                                  |

<!-- /tokens -->

## Sizes

Sizes come from one scale, numbered like the spacing scale: the number divided by 100 is the size in 4 px units, so `font.size.400` is 16 px. Roles use it.

<!-- tokens: font.size.* -->

| Token            | Value  |
| ---------------- | ------ |
| `font.size.275`  | `11px` |
| `font.size.300`  | `12px` |
| `font.size.325`  | `13px` |
| `font.size.350`  | `14px` |
| `font.size.400`  | `16px` |
| `font.size.500`  | `20px` |
| `font.size.600`  | `24px` |
| `font.size.700`  | `28px` |
| `font.size.800`  | `32px` |
| `font.size.1200` | `48px` |

<!-- /tokens -->

## Line heights

Four line heights. Use `none` for single lines in a fixed box, `tight` for headings and figures, `snug` for labels and data, and `normal` for running text.

<!-- tokens: font.line-height.* -->

| Token                     | Value  | Use                                                       |
| ------------------------- | ------ | --------------------------------------------------------- |
| `font.line-height.none`   | `1`    | Single lines in a fixed box: line badges, the kiosk clock |
| `font.line-height.tight`  | `1.15` | Headings, key figures and clocks                          |
| `font.line-height.snug`   | `1.3`  | Labels, small headings and data                           |
| `font.line-height.normal` | `1.5`  | Running text                                              |

<!-- /tokens -->
