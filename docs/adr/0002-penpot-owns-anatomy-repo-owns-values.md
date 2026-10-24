# Penpot owns a component's anatomy, the repository owns its values

Every component is designed in Penpot before it is built, and the design is the source of truth for its anatomy and variants: which parts it has, how they are laid out, and which variant properties exist. The token values stay in `tokens/`, and the token build already feeds Penpot. A design binds tokens, never literal values, and is read back into `penpot/<name>.json` with a code map from its variants and layers to React props, so the build can check that code and design agree. Without that loop a design file drifts behind the code until nobody trusts it, which is what this rule prevents.

## Consequences

Design work runs only where the Penpot MCP runs: in an open, connected Penpot tab on Marcin's Mac. The visual gate compares geometry and colour per named part rather than pixels, because Penpot and Chromium render text differently.
