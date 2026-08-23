# LLM cost calculator

A single HTML file that tells you what one request — or a month of them — costs
on 60 models, using a price table refreshed daily.

**→ <https://xyzs996.github.io/llm-cost-calculator/>**

No build step, no dependencies, no tracking, no analytics. Open the file and it
fetches one JSON price table over a CDN. Save it and it works offline against
whatever the table said last.

## Three things it does that most cost calculators don't

**1. It applies DeepSeek's peak/off-peak rate for right now, not an average.**
DeepSeek bills by the clock: peak on weekdays 01:00–04:00 and 06:00–10:00 UTC,
off-peak — half price — the rest of the time, and since `2026-08-22T16:00:00Z`
all day on Beijing-time weekends. The page shows which side of that you are on,
what the same job costs on the other side, and how long until it flips. If you
are in a peak window it tells you what waiting is worth.

**2. It treats the long-context tier as a cliff.** For the models that have one,
the moment your prompt reaches the threshold *every* token in that request
re-rates — including the tokens below the threshold. It is not marginal
pricing, and a calculator that bills the excess at the long rate understates it.
The page warns you when you're near the edge and shows what crossing it costs.

**3. Its default token mix is measured, not guessed.** Coding agents are
cache-heavy in a way that makes list prices misleading: the default here is
95.6% cache hit, 4.1% miss, 0.29% output, from 8.04B tokens of real agent
traffic. The measurement is linked on the page. Change it to yours — the point
is that the starting number came from somewhere.

## The clock logic is verified, not asserted

Time-of-day billing has a failure mode that ordinary tests cannot catch. The
Beijing weekend runs **16:00 UTC Friday to 16:00 UTC Sunday**; the two calendars
disagree only over 16:00–24:00 UTC; and both of DeepSeek's peak windows sit
clear of that stretch. So an implementation that reads the weekday off the
unshifted UTC instant passes every vector you can write against the live
schedule, and starts mispricing by 2× the day a vendor moves a window later.

This page's `phaseAt` and `nextChange` are checked against a published,
dated vector table that includes a deliberately synthetic schedule built to pin
that axis:

```
node test/check.mjs     # 18/18 passed
```

And the vectors have teeth — each failure mode injected into this page's own
implementation is caught by the vectors that claim to catch it:

| mutation to `index.html` | vectors that fail |
|---|---|
| weekday read off the unshifted UTC instant | `2026-08-28T16:30:00Z`, `2026-08-30T16:30:00Z` |
| effective-date gate removed | 2 phase vectors + the pre-rule boundary vector |
| countdown does not skip weekend-resident edges | `2026-08-28T10:30:00Z` |

The table lives at
[`xyzs996/deepseek-peak-offpeak-vectors`](https://github.com/xyzs996/deepseek-peak-offpeak-vectors)
(CC0) and `test/check.mjs` downloads it, so the check runs against the published
copy rather than a vendored one that could drift.

## Where the numbers come from

Catalogue prices from the [OpenRouter model list](https://openrouter.ai/api/v1/models);
the models that bill by the clock are additionally checked against the vendor's
own pricing page, with the date of that check carried in the data. Both live in
[`xyzs996/llm-api-pricing`](https://github.com/xyzs996/llm-api-pricing) as
[`data/prices.json`](https://raw.githubusercontent.com/xyzs996/llm-api-pricing/main/data/prices.json)
and a CSV beside it, refreshed daily. This repo holds no prices of its own — it
is a renderer, so it cannot go stale separately from the table.

Rounding, minimums, and unlisted surcharges are yours to verify. This is a
calculator, not a quote.

## If a number looks wrong

[Open an issue](https://github.com/xyzs996/llm-cost-calculator/issues/new) and
say which one. A wrong number with the vendor page beside it is the most useful
thing anyone can send.

## Elsewhere

The full price table, sortable, with the effective per-million cost under the
measured agent mix: <https://xyzs996.github.io/llm-api-pricing/prices.html>.
Write-ups on what these costs do to a small budget in practice — a different
question from what the rate card says: <https://xyzs996.github.io/llm-api-pricing/>.

MIT.
