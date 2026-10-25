---
'@mylder/perron': minor
---

Adds `stops`, `time` and `action` to `DisruptionCard`. `stops` takes a list of stop names, "Affects Nørreport, Kongens Nytorv and 3 more", or a stretch, `{ from, to }`, "Between Hellerup and Klampenborg". `time` takes `{ from, to }`, "From 08:03", "Until 22:00" or "24 to 25 October". `action` holds one link or button, such as "Show on map". It also adds a fifth `SeverityLabel` kind, `notice` ("Service notice"), for a message whose fields don't say which kind it is, with the `info-circle` icon, the `serviceNoticeLabel` prop and the token `color.transit.severity.notice`, which `DisruptionCard`'s `severity` takes too. New owned strings: `serviceNotice`, `affectsStops`, `stopListEnd`, `moreStops`, `betweenStops`, `fromTime`, `untilTime` and `timeRange`, the last seven with `{name}` placeholders, each with its `*Label` override on `DisruptionCard`.
