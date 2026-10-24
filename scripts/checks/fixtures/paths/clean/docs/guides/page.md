# Page

Every path here exists, or is not a path the check reads.

- A link beside it: [Other](../other.md), and with an anchor: [Other](../other.md#top), and from the root: [Other](/docs/other.md).
- An anchor, a URL and a mail link: [Top](#page), [Site](https://example.com/missing.md), [Mail](mailto:a@example.com).
- A repo path: `scripts/build.ts`, a folder: `docs/guides/`, and one beside this file: `./page.md`.
- Placeholders: `docs/<name>.md`, `scripts/*.ts`, `docs/…`, `scripts/{a,b}.ts`.
- Not paths: `en.ts`, `src/index.ts`, `@scope/pkg/sub`, `npm run build`, `missing/file.md`.
- Excused: `scripts/later.ts` <!-- perron-allow(paths): a fixture naming a file a later phase writes -->

```sh
node scripts/missing.ts
cat `docs/missing.md`
```

A link inside code is not a link: `[x](missing.md)`.
