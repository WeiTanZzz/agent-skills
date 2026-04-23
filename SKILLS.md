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
