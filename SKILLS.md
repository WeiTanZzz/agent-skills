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
