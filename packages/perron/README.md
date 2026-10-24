# @mylder/perron

Perron is the design system of Mylder, a live map of Copenhagen's buses, S-tog, metro and regional trains. This package holds its foundations: the design tokens as CSS custom properties and TypeScript, the fonts, the icons and the Mylder mark.

```sh
npm install @mylder/perron
```

Load the stylesheet once at the app root. It brings the fonts, the tokens for both themes and for reduced motion, the typography classes and a few page defaults.

```ts
import '@mylder/perron/perron.css'
import { theme } from '@mylder/perron/tokens.ts'
```

Read a token in CSS as `var(--perron-color-text-primary)`, and never copy a value. Light is the default theme; set `data-theme="dark"` on any element for dark. The icons and the mark are SVG files under `@mylder/perron/icons/` and `@mylder/perron/logos/`.

The rules for each foundation, and the source, are in the [Perron repository](https://github.com/marcin-sieradzki/perron).
