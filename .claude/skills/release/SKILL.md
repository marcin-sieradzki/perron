---
name: release
description: Check a branch's changesets, review the Version packages PR, and say what the maintainer and an agent each do to release.
disable-model-invocation: true
---

Both packages release from CI with Changesets. The source of truth is `.github/workflows/release.yml`, whose head comment says what it does; in short:

1. A PR that changes what a package ships adds a changeset, `.changeset/<name>.md`.
2. On every push to `main` with changesets waiting, the workflow runs `changeset version` and `npm run check`, and force-pushes the result to `changeset-release/main` as the "Version packages" PR. The workflow's own token opens it, so CI never runs on it: the workflow's check is its only check.
3. Merging that PR leaves no changesets, so the next run packs the versions npm lacks, smoke-tests the tarballs in a scratch app, publishes them with provenance through npm trusted publishing, and pushes the tags `<package>@<version>`.

## Pre-flight

Read these before writing anything:

- `.github/workflows/release.yml`, the Releases section of `README.md`, `.changeset/README.md` and `.changeset/config.json`.
- `files` and `exports` in `packages/perron/package.json` and `packages/mcp/package.json`: what each package ships.
- The contract's Change section, `docs/components/README.md`, with its Breaking changes table.
- `packages/perron/CHANGELOG.md` and `packages/mcp/CHANGELOG.md`: the voice of a changelog line.

Then run the branch for the job the maintainer asked for.

## Check a branch's changesets

1. **Find what ships.** `git diff --name-only origin/main...HEAD`. A change ships when it lands in a package's `files`: its `src/` less tests, stories, fixtures and `src/testing/`, which the build leaves out; its tokens, styles, icons, logos and `data/` (which holds every page in `PAGES` of `scripts/lib/pages.ts`, so a docs change ships too); and its `package.json` dependencies. `@mylder/perron-mcp` depends on `@mylder/perron`, and Changesets bumps it on its own when `@mylder/perron` moves. Done when each changed path is marked ships or not.
2. **Match the changesets.** Each shipped change has a changeset naming its package, and a change that ships nothing has none. `npx changeset status --since=origin/main` fails when a package's folder changed with no changeset; it counts every file there, tests included. Done when every shipping package has a changeset, and the status passes or fails only for a package whose changes ship nothing.
3. **Check each changeset.** The bump fits: `major` for a break, which also needs its row in the contract's Breaking changes table; `minor` for something new, such as a component, prop, export or doc; `patch` for a fix or a changed word. The line says what a consumer of the package gets, in the present tense, with names in code spans, as the changelogs do. Done when every changeset on the branch has been read.

Write a missing changeset with `npx changeset`, or as its Markdown file by hand. Commit it on the branch.

## Review the Version packages PR

1. **Read it**: `gh pr view changeset-release/main` and `gh pr diff changeset-release/main`, and the workflow run that wrote it, `gh run list --workflow release.yml --limit 1`. Done when the run passed, including its `npm run check`; a failed run is the review's whole finding, with its log.
2. **Check the diff.** Every changeset is deleted and appears as a line under the new version of its package's `CHANGELOG.md`. Each version rises by the largest bump among its changesets. `package-lock.json` carries the same versions. A `major` bump has its row in Breaking changes. Done when every package in the diff has been checked.
3. **Comment** the review on the PR with `gh pr comment`: ready to merge, or what to fix. A wrong line or bump is fixed in its changeset by a PR to `main`, since the next push to `main` rewrites the release branch and drops any edit made on it. Done when the comment is posted.

## Who does what

| An agent may                                                        | Only the maintainer                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Write and check changesets on a branch                              | Merge any PR, the Version packages PR included: that merge is the release      |
| Review the Version packages PR and comment on it                    | Re-run the release workflow                                                    |
| Fix a changelog line through a PR to `main`                         | Repository settings, such as letting GitHub Actions create pull requests       |
| Read workflow runs and logs to say why a release failed             | npm: trusted publishing for each package, and the bootstrap `NPM_TOKEN` secret |
| After a release, confirm it: `npm view <package> version`, the tags | Take a shipped break's row out of Breaking changes, by merging that PR         |

An agent leaves `changeset version`, `changeset publish`, `npm publish` and pushing tags to the workflow, so every release is the one the workflow checked.

A publish that fails part way still pushes the tags of what made it. Once the cause is fixed, the next run packs only what npm lacks, so re-running publishes the rest.
