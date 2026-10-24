# Components are built by a local software factory

The component loop of [ADR 0003](0003-three-agent-component-loop.md) runs as a software factory on the maintainer's machine, so that a component goes from a filed issue to a ready PR with the maintainer acting only at two gates: approving the design in Penpot, and merging the PR. GitHub Issues are the interface, one issue per component, with labels as the router and `dependsOn` in the registry deciding the order. Claude Code is both the orchestrator and the runner, started by the maintainer with `/factory`, and every run keeps its memory in the issue, the PR and `pipeline.yaml`, never in a session. It runs locally because the Penpot MCP only works in a connected tab on that machine, and because the factory runs on the maintainer's Claude subscription. The factory acts as the maintainer's own GitHub login at first, and gets its own GitHub App once more than one component runs at a time, so that its comments notify the maintainer and its PRs can be approved.

## Considered options

- **Cloud runners (GitHub Actions with the Claude Code action).** Rejected: no cloud runner can reach the Penpot tab, and Actions bills an API key rather than the subscription.
- **Pi with Pi Durable as the orchestrator.** Rejected: it journals runs and resumes them well, but it runs its own agent loop against the model, which needs an API key. Claude Code's resumable workflows, `/workflows` view and Remote Control cover the same needs on the subscription.
- **A GitHub App from the start.** Deferred: with one component in flight the board shows every gate, and merging needs no approval. Every call reads its token from `GH_TOKEN`, so the switch is one token.

## Consequences

The factory starts slow: one component in flight, every PR merged by a person, caps of 3 build attempts and 2 review rounds before `needs-human`, and a retro after every fifth merged component. The visual check is an automated gate whose report goes on the PR, no longer a separate sign-off.
