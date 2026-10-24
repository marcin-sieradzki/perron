# Issue tracker: GitHub

Perron's work is tracked in this repository's GitHub Issues, through the `gh` CLI, which finds the repository from the clone. The engineering skills (`to-spec`, `to-tickets`, `implement-spec`, `code-review`) read and write issues as this page says. The factory ([ADR 0008](../adr/0008-local-component-factory.md)) uses the same issues for components, with rules of its own in ROADMAP 5.4.

## Specs

- **A component's spec** is its page, `docs/components/<name>.md`, in the layout of `docs/components/TEMPLATE.md` (ROADMAP 2.2). The factory's brief stage writes it from the Penpot design, and it ships in the component's PR. The component's issue is filed by the factory's decompose run, one per entry in `components.json`.
- **Any other spec**, such as a script, a check, an MCP tool or a piece of the factory, is a GitHub issue. Its tickets are its sub-issues.

## Operations

- **Create**: `gh issue create --title "..." --body-file -`, with the body in a heredoc.
- **Read**: `gh issue view <n> --json number,title,body,labels,comments`. A bare `#<n>` may be a PR, since issues and PRs share numbers: fall back to `gh pr view <n>`.
- **List**: `gh issue list --state open --json number,title,labels`.
- **Sub-issue**: `gh issue create --parent <spec> ...`, or `gh issue edit <spec> --add-sub-issue <n>` afterwards. Where `gh` is older than 2.94, put `Part of #<spec>` at the top of the body.
- **Blocking**: a `## Blocked by` section listing `#<n>` for each blocker, the form the factory's decompose run writes too. A ticket is on the **frontier** once every issue it lists is closed.
- **Comment**: `gh issue comment <n> --body-file -`.

## Labels

Specs and tickets go up unlabelled. Perron's labels belong to the factory: one per stage (`design`, `brief`, `build`, `review`, `docs`, `visual`), plus `design-approved`, `needs-human`, `factory:running` and `retro`, and each one moves a component through its loop.

## Closing work

Work closes through a PR whose body says `Closes #<n>` for the spec and each ticket it finishes. The maintainer merges every PR, and the merge closes the issues, so an agent's work ends at a PR marked ready for review.
