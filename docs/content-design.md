# Content design

How every word in Mylder reads: plain sentences, exact about certainty, in English and Danish. The foundations are in [foundations/](foundations/README.md).

- Say what is happening in plain sentences, then how sure we are. "Signal fault at Danshøj. Trains between Flintholm and Ny Ellebjerg run slower than planned." Never claim more certainty than the data has: a vehicle without a signal is "No signal since 08:02", not a guess.
- Sentence case everywhere: "Show whole line", "Back to the map", "Reporting live, by operator". Capitals come only from the `perron-typography-overline` style, so write the source text in sentence case.
- Speak about the city and its vehicles, not about the person. Address them only in instructions: "Try a line number such as 5C."
- Numbers: 24-hour clock ("08:14"), a space before units ("4 min", "45 km/h"), the true minus sign for early ("−1"), "—" for unknown, "≈" before estimates, "~" before estimated times. Countdowns under 45 seconds read "Now".
- Data states and delays always use the same words, in English and Danish, so every screen agrees. Live / Live, Ageing / Ældre, Estimated / Beregnet, Timetable only / Kun køreplan, No signal / Intet signal; Delays / Forsinkelser, Running normally / Kører normalt, Show on map / Vis på kort. Don't write your own wording for them.
- Name keys in help text: "Keys: + and − zoom, arrows pan, Esc closes panels."
- No emoji, no exclamation marks.
