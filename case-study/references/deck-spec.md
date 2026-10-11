# Deck spec format

Written in phase 2 from the analysis file and the user's decisions; read by `scripts/render.ts`.
Markdown with YAML front matter; structured visuals go in fenced `yaml` blocks. Keep the headings,
slide ids and field names exactly as below: the renderer parses them literally and warns on
anything it does not recognise.

Presenter-only: `notes:` on every slide, `# Asks` (rendered as a coverage slide) and `# Q&A prep`.
The renderer marks these `data-private` (Deck HTML v1), so the hosting runtime never sends them
to viewers.

## Skeleton

````markdown
---
client: <client name>
deck_title: <short title, ≤ 6 words>
governing_thought: <the user's one sentence>
date: <optional, e.g. 12 October 2026; defaults to today>
---

# Asks
- Q1: <verbatim from the pack>
- Q2: <verbatim>

# Slides

## answer
title: <full-sentence conclusion, ≤ 12 words>
kicker: <section label>
answers: [Q1]
body:
- Problem: <one line>
- Recommendation: <the governing thought>
visual:
```yaml
type: pillars
items:
  - head: <pillar headline>
    text: <one line>
```
notes: <what to say, ~2 min>

## context
title: …
kicker: …
answers: []
body:
- …
visual: none
notes: …

# Q&A prep
- Q: <likely challenge>
  A: <acknowledge → reason → what would change the decision, ≤ 2 lines>

# Assumptions and open questions
- A1: <assumption> — validate by <how>
- O1: <open question> — owner <who>
````

Field values can run over several lines; a field ends where the next field starts. `body` is
markdown: `- ` bullets, `| … |` tables, `**bold**`. A bullet that starts with `Label:` gets the
label bolded. `[Ex A]`-style source tags render as small chips. One `> ` line per slide, at most
~20 words, renders as the takeaway callout pinned to the bottom: the "so what" of the slide. It
does not count towards the 40-word body limit.

## Slides

Exactly seven, in this order, with these ids. Every slide has all six fields. `answers` lists the
`Qn` the slide covers (may be `[]`). `visual` is one or more fenced `yaml` blocks, or `none`.

| # | id | Purpose | body | visual | Talk time |
|---|---|---|---|---|---|
| 1 | `answer` | Problem and the user's answer on one page | `Problem:` and `Recommendation:` bullets | `pillars` | 2 min |
| 2 | `context` | What we found: situation, tensions, the numbers that matter | ≤ 3 situation bullets, tensions one line each | `metrics` and/or `chart` | 3 min |
| 3 | `solution` | The whole solution at once | 3–5 callouts tying components to pillars | `diagram` | 5 min |
| 4 | `tensions` | Each tension → the mechanism chosen | Table: Tension · Mechanism · Why it works · What we trade off | `none` | 4 min |
| 5 | `poc` | What the PoC builds, what it proves | In scope, out of scope, use case, measurable success criteria | `diagram` (PoC subset highlighted) or `timeline` | 3 min |
| 6 | `production` | PoC → production | Table: Area · What we add · Why | `none` | 3 min |
| 7 | `delivery` | Roadmap, client asks, risks, decisions needed | Team, client asks, top 3 risks → mitigation | `timeline` | 3 min |

`answer` renders as a statement page; `tensions` and `production` render full width; the rest
render as text on the left and visuals on the right. The renderer adds a cover slide in front and
an assumptions slide at the end.

## Visual types

### pillars
```yaml
type: pillars
items:            # exactly 3
  - head: One pipeline template, many teams
    text: Teams inherit security checks by default
```

### metrics
```yaml
type: metrics
items:            # ≤ 4
  - value: 3 days
    label: Median lead time to production
    source: Ex B
```

### chart
```yaml
type: chart
kind: bar         # bar | line
title: Deployments per week
x: [Mar, Apr, May]
series:           # ≤ 4; values ≥ 0
  - name: Deploys
    values: [12, 15, 21]
source: Ex B
note: <one-line takeaway shown under the chart>
```

### diagram
```yaml
type: diagram
lanes:            # top to bottom; 2–4 lanes, ≤ 5 nodes each; lane names ≤ 3 short words
  - name: Product teams
    nodes:
      - id: checkout
        label: Checkout service
        sub: existing
  - name: Shared platform
    nodes:
      - id: gw
        label: API gateway
        sub: auth · routing · rate limits
edges:            # connect nodes in the same or adjacent lanes; longer jumps cross other nodes
  - from: checkout
    to: gw
    label: HTTPS + OIDC
    dashed: false # optional: async or planned flows
highlight: [gw]   # accented: new components, or the PoC subset on slide 5
retire: []        # drawn dashed red: things being replaced
caption: <one line under the diagram>
```

### timeline
```yaml
type: timeline
unit: week        # week | month
phases:
  - name: PoC
    start: 1
    end: 6
    outcome: First team deploying through the template
```
