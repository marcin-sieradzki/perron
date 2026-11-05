---
'@mylder/perron-mcp': minor
---

Two tools for components and patterns. `list_components` lists them one JSON line each, with what each is in one sentence, filtered by words, layer and category. `get_component` gives one whole: its import line, when to use it and which entries to use instead, its props with their types, defaults, descriptions and deprecations, its rules with their ids, levels and what checks them, the mistakes agents have made with it, and its docs page; an unknown name answers with the nearest names. Both read the project's own `@mylder/perron` first.
