---
'@mylder/perron': minor
---

`SourceLine`'s sources can say what each time is of, in the app's own words: a source's new `label` is a template with a `{time}` placeholder, such as `'position {time}'`, shown in place of "updated {time}", and `dateTime` gives the `<time>` element a machine-readable value for a time written as a date, such as `'12 October'`. `name` and `time` are now optional, so one provider's name can stand before two facts, "Rejseplanen · position 08:14:05 · times 08:14:20", and a fact can have no time, "times from the timetable". A labelled source whose `outOfDate` is set adds "may be out of date" after its label, through the new owned string `sourceLabelOutOfDate`, "{label}, may be out of date", overridden by the new `sourceLabelOutOfDateLabel` prop. Lines without a `label` render as before.
