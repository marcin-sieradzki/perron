---
'@mylder/perron': patch
---

Every component, every pattern and `PerronProvider` open with the `'use client'` directive, so a React Server Components app, such as a Next.js one, can import `@mylder/perron` from a server module: the components arrive as client references instead of failing with `createContext is not a function`.
