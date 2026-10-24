# Findings format

The format every audit skill reports in, so the build's self-gate and the reviewer read one shape.

```md
# <Audit>: <scope>

Checked: <what was covered, such as "Button and Select, 14 stories, light and dark">.

## Defect

- **Defect-1.** `<where>` One sentence: what is wrong, and the rule it breaks.

## Polish

None.

## Direction

- **Direction-1.** `<where>` One sentence: the question, and the options.
```

- **Defect:** wrong by a written rule: a contract section, a foundation page, a spec line (`CR-n`, a Tokens row), a checklist line, content design. Name the rule.
- **Polish:** right by the rules, but rough. Name what would make it better.
- **Direction:** a question only the maintainer can answer, such as the design itself or a new rule.
- `<where>` is `path:line` for a file, or `<story-id> <theme>` for a render, with the part: `components-button--solid-hover dark, root`.
- Every heading is present, and an empty one says `None.` The `Checked:` line always says what was covered, so an empty library reads "Checked: nothing; no entry is past designing".
- The build's self-gate fixes every Defect and Polish and runs the audit again. The reviewer writes a Defect as P1, a Polish as P2 and a Direction as P3.
