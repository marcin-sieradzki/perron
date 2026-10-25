# Review: NormalService, round 1

## P1

None.

## P2

None.

## P3

- **P3-1.** `docs/components/normal-service.md:73` The Keyboard and ARIA prose says how to use NormalService as a control: "A caller who makes it a link or button through `render` ... must give it a target of `size.target-min`". The Do and don't row at line 134 says not to do this: "Make NormalService itself a control through `render`". No rule decides which line holds, and the sentence is copied from SeverityLabel's spec (`docs/components/severity-label.md:84`). The maintainer may want both specs to say the same as the Do and don't row.
- **P3-2.** `docs/components/normal-service.md:99` The Owned strings prose says Content design gives the word "in all four languages" but lists only the three translations ("Kører normalt", "Går som vanligt" and "Går som normalt"). Adding "Running normally" or saying "in the other three" would match the count (content-audit, docs).
