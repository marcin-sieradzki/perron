# Content design

How every word in Mylder reads: plain sentences, exact about certainty, in English, Danish, Swedish and Norwegian Bokmål. The foundations are in [foundations/](foundations/README.md).

- Say what is happening in plain sentences, then how sure we are. "Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned." Never claim more certainty than the data has: a vehicle without a signal is "No signal since 08:02", not a guess.
- Sentence case everywhere: "Show whole line", "Back to the map", "Reporting live, by operator". Capitals come only from the `perron-typography-overline` style, so write the source text in sentence case.
- Speak about the city and its vehicles, not about the person. Address them only in instructions: "Try a line number such as 5C."
- Numbers: 24-hour clock ("08:14"), a space before units ("4 min", "45 km/h"), the true minus sign for early ("−1"), "—" for unknown, "≈" before estimates, "~" before estimated times. Countdowns under 45 seconds read "Now".
- Data states and delays always use the words in the table below, in every language, so every screen agrees.
- Name keys in help text: "Keys: + and − zoom, arrows pan, Esc closes panels."
- No emoji, no exclamation marks.

## Data-state and delay words

Components take these from the locale dictionaries in `packages/perron/src/locale/`, which a test holds to this table. Change a word in both.

| English          | Danish        | Swedish          | Norwegian Bokmål |
| ---------------- | ------------- | ---------------- | ---------------- |
| Live             | Live          | Live             | Live             |
| Ageing           | Ældre         | Äldre            | Eldre            |
| Estimated        | Beregnet      | Beräknad         | Beregnet         |
| Timetable only   | Kun køreplan  | Endast tidtabell | Kun rutetabell   |
| No signal        | Intet signal  | Ingen signal     | Ingen signal     |
| Delays           | Forsinkelser  | Förseningar      | Forsinkelser     |
| Running normally | Kører normalt | Går som vanligt  | Går som normalt  |
| Show on map      | Vis på kort   | Visa på kartan   | Vis på kartet    |
