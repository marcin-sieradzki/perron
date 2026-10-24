# Components on Base UI, with APIs shaped like MUI's

Perron's components are built on Base UI (`@base-ui/react`), which brings the behaviour and accessibility, and their props follow MUI's conventions (`variant`, `color`, `size`, adjective booleans, `startIcon`, `slotProps`), so the API reads like the one most React developers know. Events follow MUI too: `onChange(event, value, details)` for every value, with the native `onChange(event)` on text inputs so form libraries register them unchanged, and `onOpen`/`onClose(event, reason)` for open state. Each component adapts Base UI's `onValueChange` and `onOpenChange` once, and passes Base UI's details (the reason and `cancel()`) as the last argument, so nothing Base UI offers is lost. The one place Base UI's shape wins is the `render` prop instead of MUI's `component`, since Base UI is built around it. MUI is a reference for API shape only, never a dependency at runtime: no `sx`, `classes`, `styled` or theme object, since styling comes from the DTCG tokens as CSS variables.

## Considered options

- **Hand-built behaviour.** Rejected: overlays, focus and keyboard handling are where hand-built components fail, and Base UI already tests them.
- **MUI itself, themed.** Rejected: its styling engine and Material look fight a token-first, one-brand system.

## Consequences

`@base-ui/react` is pinned to an exact version and upgraded only in its own PR after reading its release notes: it has shipped breaking renames in minor releases. Lint bans the old `@base-ui-components/*` name, `@base-ui/react/internals/*` and any `@mui/*` import at runtime.
