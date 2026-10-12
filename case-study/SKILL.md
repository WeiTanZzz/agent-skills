---
name: case-study
version: 1.0.0
type: hybrid
requires:
  - bun
scripts:
  - scripts/render.ts
description: >
  Analyse a consulting-style technical case study pack (fictional client; platform engineering,
  developer experience, AI platform, CI/CD or cloud architecture problem; "recommend an
  architecture, a PoC and a path to production"). Lays out the asks, facts, tensions, key numbers
  and the decisions the presenter has to make, with options and trade-offs, but never makes those
  decisions. Only when the user explicitly asks does it turn their decisions into a deck spec and
  render a consistent HTML deck. Use when the user pastes or points to a case pack, says "analyse
  this case", "case study", "/case-study", or asks to build the deck/HTML for a case already
  analysed. Not for reviewing an existing deck or general architecture questions with no brief.
---

# case-study

The setting: a short, fixed time to read a case pack and prepare, then a presentation to senior
engineers who will challenge every choice. The panel usually pairs a technical lead, who drills
into how the design works and fails, with a business or solutions lead, who tests client focus and
commercial sense. Both halves score: a design that survives the drill-down, and a recommendation
tied to the client's outcomes and people. The user owns every decision; this skill makes the
problem legible and, on request, makes the user's answer presentable.

Three rules shape everything:

1. **Concise enough to absorb at a glance.** One message per block, the answer before the detail,
   nothing that does not serve the client's questions.
2. **Concise, not vague.** Name the service, protocol or mechanism (`OIDC workload federation`,
   `SCPs`, `PrivateLink`, `semver`). Cut buzzwords and adjectives, never technical precision:
   "rules on old accounts" or "hides personal data" reads as not knowing how. But every term on a
   slide must be one the presenter can explain in a sentence; what they cannot explain comes off.
3. **The human decides.** Analysis lays out options and trade-offs; it never recommends, ranks or
   picks. The deck is built only from decisions the user has stated, and only when they ask.

Talk to the user in their language. Write analysis files and slide text in the language of the
case pack.

## Phase 1 — Analyse (default)

### Input

- The case pack: a file path, or text pasted into the chat. Read all of it once, fully.
- Output: `<pack-name>.analysis.md` next to the pack, or `./<client-slug>.analysis.md` if the pack
  was pasted.

Never invent facts about the client. Anything not in the pack is an **assumption** and is labelled
as one. Cite the source of every number: `[Ex A]`, `[Email: CISO]`, `[§3]`.

### Steps

**1. Lift out the asks.** Copy the client's questions verbatim and number them `Q1…Qn`. They are
the marking scheme.

**2. Sort the facts into five buckets.** One line per item; skip anything that bears on no ask.

| Bucket | What to capture |
|---|---|
| Goals | The business outcome (cost, speed, risk, revenue). Tech is the means. |
| Constraints | Regulation, data residency, budget, headcount, deadlines, procurement lead times, mandated stack |
| Stakeholders | Each named person: what they want, what they fear, what they will block |
| Assets | The technical estate as it is wired today (accounts, identity, CI/CD, IaC, runtimes, data sources, model access) and what could be reused, extended or retired |
| Numbers | Volumes, growth, spend, latency, capacity |

**3. Name the tensions.** Packs are written around 2–4 deliberate conflicts. State each as
`<who> wants <A> / <who> wants <B> — because <root cause>`. Typical ones: speed vs control,
central platform vs team autonomy, build vs buy vs reuse, ideal design vs what the team can
operate, cost growth vs value.

**4. Do the maths.** Pick the 1–3 numbers whose implication would change a decision: cost at full
rollout, run-rate growth, peak load, team capacity against backlog, deadline against lead time.
Add one value line: what the change is worth (time saved across teams, cost avoided, risk removed)
against what it costs. One line each: formula = result → implication. Round hard; label anything
not in the pack as an assumption.

**5. List the decisions to make.** Each is a choice the presenter must own, phrased as a question
(`D1: Reuse, rebuild or retire the existing X?`). Every tension from step 3 must be resolved by at
least one decision.

*Design decisions.* One or more per area below; skip an area only when the pack makes it
irrelevant, and say why in one line:

| Area | Typical questions |
|---|---|
| Identity and access | Workforce and workload identity; how the end user's identity reaches each service; least privilege |
| Data flow and boundaries | Where sensitive data goes; residency and region; where redaction or filtering happens; what crosses which boundary |
| Core components | Build, buy or managed service for each new component (gateway, agent runtime, portal, …) |
| CI/CD and IaC | Pipeline model; reusable templates and modules; how pipelines authenticate to deploy |
| Accounts and environments | Account or subscription structure; guardrails; how the existing estate is brought in |
| Tenancy and cost | How tenants or teams are isolated; quotas and rate limits; cost attribution and chargeback |
| Adoption and product model | Paved road or mandate; onboarding; versioning and deprecation of what the platform ships; how success is measured |
| Resilience and operations | HA/DR target; observability; who is on call for what |

*Delivery decisions.* PoC scope and use case is always one. Add sequencing and staffing, and one
decision for each stakeholder conflict or commercial number (budget, renewal, spend growth) that
forces a choice.

Every option names a concrete mechanism or service, not a quality ("API Gateway + Lambda proxy"
or "LiteLLM on ECS", not "a lightweight proxy"). For each decision give 2–3 options, and for each
option:

- what it means in one line;
- which tensions it eases and which it worsens;
- which constraints or numbers it collides with;
- what you would have to believe for it to be right.

Do **not** mark a preferred option, order options by merit, or write a governing thought.

**6. Note assumptions and open questions** the presenter will need to state or ask the client. An
assumption is a premise the recommendation depends on, not a schedule or a hope; each one says
what changes if it is wrong and how it gets validated. Do not restate an open question as an
assumption.

### Output

Write the analysis file in the format of [references/analysis.md](references/analysis.md). Then
reply in chat with no more than: the tensions (one line each), the key numbers and their
implications, and the decision list with option names only, followed by the file path. Ask the
user to state their decisions; nothing else happens until they do.

### Recording decisions

When the user states decisions, write them into the analysis file's `# Decisions` section in
their words (`D1: <chosen option> — <their reason>`), including any governing thought they give.
If a stated decision contradicts a constraint or number in the pack, point that out once, briefly,
and record what they decide. Do not build anything yet.

## Phase 2 — Build the deck (only on explicit request)

Start this phase only when the user explicitly asks to build the deck or HTML ("build the HTML",
"出 deck", "生成 html"). Recorded decisions are not a request to build.

1. **Check the decisions.** Every `D` in the analysis needs a recorded decision, and every design
   area from phase 1 step 5 needs at least one. If any is missing, or there is no governing
   thought, list what is missing and stop. Do not fill gaps yourself.
2. **Write the deck spec** to `<pack-name>.deck.md` in the format of
   [references/deck-spec.md](references/deck-spec.md) (a complete example is in
   [references/example.deck.md](references/example.deck.md)), using only the facts in the
   analysis and the user's decisions. Turn each decision into slide content; the presenter's reasons become the
   "why" columns and speaker notes. You may spell out how a chosen option is built (the standard
   mechanics of the named service or pattern), but never make a further design choice the user has
   not made: if a slide needs one, list it and stop, as in step 1. Writing rules:
   - every slide title is a full-sentence conclusion of at most 12 words, so the titles alone tell
     the user's argument;
   - no more than ~40 words of body text per slide outside tables and diagrams;
   - technical terms stay precise (rule 2 above); the notes explain every named service, product
     or acronym on the slide in one line, and, if the user has said which stack they know best,
     name its equivalent there;
   - the callout on every technical slide (`solution` to `production`) names the outcome or the
     stakeholder it serves, so depth and client focus show on the same page;
   - `delivery` gives each phase a deliverable and an owner, and states the 2–3 assumptions the
     plan rests on;
   - every new node in the `solution` diagram names its AWS service or product in `sub`, and lanes
     follow real boundaries (account, VPC, region, trust zone) where they matter;
   - `flow` traces the riskiest request end to end and shows where each control fires;
   - every number has a source or is marked as an assumption;
   - every `Qn` is answered on a named slide;
   - every tension appears on the `tradeoffs` slide with the mechanism the user chose.
3. **Prepare for challenge.** Fill `# Q&A prep` with 8–12 questions the panel is likely to ask about
   the user's choices, tagged and split roughly half and half:
   - `[Tech]`: what a hands-on platform engineer drills into: how a component works, what happens
     when it fails, how the security model is attacked or bypassed, limits and scale, migration
     mechanics;
   - `[Biz]`: stakeholders, cost, delivery, risk.

   Answer each in at most two lines: acknowledge the concern → the reason or mechanism → what would
   change the decision. Mechanisms of the chosen design may be explained; reasons for choices come
   only from the user. Where the user gave no reason, write `A: (your reason)` rather than
   inventing one. Where a real past project would make an answer stronger, end it with
   `(your story)` for the user to fill.
4. **Render.** Run
   `bun <this-skill-dir>/scripts/render.ts <spec> [--out <file.html>]`. The script owns all
   layout and styling, so every deck looks the same; never hand-edit the generated HTML. Fix every
   warning it prints by editing the spec and re-running.
5. **Validate.** The output is a Deck HTML v1 file: no scripts, presenter-only content marked
   `data-private`, navigation supplied by the hosting runtime. If a `deck-html` skill is
   available, run its validator on the output and get to 0 errors before replying.
6. **Reply** with the HTML path and the slide titles in order.

Presenter-only content: speaker notes (opened with the dashed **Notes** button at the bottom
right, which only the presenter sees), the Q&A prep slide and the ask-coverage slide. Viewers of
the hosted deck never receive them; anyone watching the presenter's shared screen does, so keep
notes closed while screen-sharing.
