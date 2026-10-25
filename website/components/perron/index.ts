'use client'
// @mylder/perron as it ships, behind a client boundary. The package's components use React state
// and context and carry no "use client" of their own, so a server component (a page, a preview)
// imports them from here: `import { Button } from '@/components/perron'`. A file that is already
// 'use client' may import '@mylder/perron' directly; both are the same module.
export * from '@mylder/perron'
