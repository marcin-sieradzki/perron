---
'@mylder/perron': patch
---

SeverityLabel breaks a translated name with a word longer than its line inside the label, and StopTimeline breaks a word longer than the name's column inside it, rather than overflowing. The contract in the docs data now says every rule that sets a typography role decides what a long word does.
