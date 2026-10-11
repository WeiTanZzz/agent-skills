# Skills Catalog

An index of all available skills with notes on usage and design.

---

## [2gif](./2gif/SKILL.md)

**Type:** hybrid  
**Requires:** `ffmpeg`

Convert videos, image sequences, or existing GIFs into optimized animated GIFs.

**Insights:**
- Uses ffmpeg's two-pass palette method for best color accuracy — significantly better than single-pass.
- Built-in file size reduction strategy (lower fps → shrink dimensions → reduce palette → stronger dithering) gives a clear decision tree instead of trial and error.
- Handles three distinct input types (video, image sequence, existing GIF) with branching logic — ask for clarification if the input type is ambiguous.
- Always reports output size and proactively suggests compression when the result exceeds 5 MB.

---

## [grill-me](./grill-me/SKILL.md)

**Type:** prompt  
**Source:** [mattpocock/skills](https://github.com/mattpocock/skills/blob/main/grill-me/SKILL.md)

Stress-test a plan or design by being interviewed relentlessly until every branch of the decision tree is resolved.

**Insights:**
- Questions are asked one at a time to avoid overwhelming the user.
- Each question comes with Claude's recommended answer — it's a collaborative interrogation, not just a quiz.
- If a question can be resolved by reading the codebase, Claude does so rather than asking — keeps the conversation focused on genuinely open decisions.

---

## [techarch](./techarch/SKILL.md)

**Type:** prompt  
**References:** `references/greenfield-template.md`, `references/review-checklist.md`

System design, architecture review, tech selection, and trade-off analysis.

**Insights:**
- Scales output to the question: focused trade-off for scoped questions, full architecture doc for greenfield, checklist evaluation for existing systems — avoids unnecessary verbosity.
- Simplicity-first principle: actively discourages microservices, event buses, and caching layers unless scale/reliability clearly justifies them.
- Never proceeds with hidden assumptions — always states them explicitly before the design.
- Includes an evolution path section (MVP → Growth → Scale) triggered by observable signals, not calendar time.

---

## [case-study](./case-study/SKILL.md)

**Type:** hybrid  
**Requires:** `bun`  
**References:** `references/analysis.md`, `references/deck-spec.md`, `references/example.deck.md`

Analyse a consulting-style technical case study pack, then — only when asked — turn the presenter's own decisions into a consistent HTML deck.

**Insights:**
- The human decides: analysis lays out asks, facts, tensions, key numbers and the decisions to make with options and trade-offs, but never recommends or ranks; the deck is built only from decisions the user has stated, and only on an explicit request.
- The client's own questions are treated as the marking scheme: the renderer warns if any ask is not answered on a slide.
- Answer first and concise: slide 1 is the problem and the answer; every title is a full-sentence conclusion, and the renderer warns on long titles and wordy slides.
- Style consistency comes from code, not prompting: `scripts/render.ts` owns all layout, colours and diagram drawing (auto-laid-out lanes, charts, timelines), so every deck looks the same.
- Output is a Deck HTML v1 file (no scripts; navigation comes from the hosting runtime). Speaker notes, Q&A prep and an ask-coverage slide are `data-private`, so viewers never receive them.

---

## [deck-html](./deck-html/SKILL.md)

**Type:** hybrid  
**Requires:** `bun`  
**References:** `references/spec.md`

Create, convert or fix a Deck HTML v1 file: one self-contained HTML deck served live at deck.txz.cool, where viewers follow the presenter's slide, cursor and selection.

**Insights:**
- The spec is the source of truth and ships with the skill (`references/spec.md`), alongside a single-file build of the platform's own validator (`scripts/validate.js`), so a deck that passes here passes the upload check. Both are generated from the platform, never hand-edited.
- Conversions replace scripts with declarative features (`data-go`, `data-toggle`, `data-fx`, `data-private`) and say what had to become static instead of silently dropping it.
- The validator can't see layout, so `scripts/preview.ts` renders every slide as a dashed 1280×720 frame to catch overflow, with toggles open or private content removed.
- `scripts/inline-assets.ts` turns local images and fonts into `data:` URIs and checks the 5 MB limit; remote assets are only downloaded with the user's OK.
