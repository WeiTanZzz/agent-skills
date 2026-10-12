<!-- Generated from the deck platform's SPEC.md and validator by `bun run skill:sync`. Do not edit by hand. -->

# Deck HTML v1

A deck is **one self-contained HTML file**: slides, CSS, images and fonts, but no scripts. The platform validates it on
upload and adds a runtime that provides everything interactive: navigation, the slide map, fullscreen, toggles, effects,
and live sync from presenter to viewers.

## Minimal example

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="deck:spec" content="1">
<meta name="deck:presenter" content="Ada">
<meta name="deck:subtitle" content="Q3 review for the leadership team">
<title>Quarterly review</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">
<style>
:root { --accent: #7c3aed; --accent-soft: #ede9fe; }
.slide { padding: 56px 72px; }
.more { display: none; }
.more.open { display: block; }
.notes { position: absolute; right: 72px; bottom: 36px; width: 360px; }
</style>
</head>
<body>
<section class="slide" id="intro" data-title="Intro" data-home>
  <h1>Quarterly review</h1>
  <p><a href="#numbers" data-go="numbers">See the numbers →</a></p>
</section>

<section class="slide" id="numbers" data-title="Numbers &amp; trends" data-parent="intro">
  <h2>Revenue up 12%</h2>
  <button data-toggle="drivers" data-fx="burst">What drove it?</button>
  <ul class="more" data-toggle-target="drivers"><li>Two new enterprise customers</li><li>Lower churn</li></ul>
  <aside class="notes" data-private>Presenter only — if asked, open <a href="#backup" data-go="backup">the backup slide</a>.</aside>
</section>

<section class="slide" id="backup" data-title="Backup: churn by cohort" data-parent="numbers" data-private>
  <img alt="Churn by cohort" src="data:image/png;base64,iVBORw0KGgo=">
</section>
</body>
</html>
```

## Document

| Requirement | |
|---|---|
| Size | At most 5 MB (UTF-8 bytes), everything inlined |
| `<meta name="deck:spec" content="1">` | Required |
| `<title>` | The deck's name (admin list, login page, browser tab). Missing → warning; the first slide's `data-title` is used |
| `<meta name="deck:presenter" content="…">` | Optional. Fallback presenter name for the status bar until a presenter connects (on deck.txz.cool presenters type their own name at sign-in). Default `Presenter` |
| `<meta name="deck:subtitle" content="…">` | Optional. Shown on the login page |
| `<meta charset="utf-8">`, viewport meta | Recommended |

The file must be self-contained: images, audio and video as `data:` URIs, fonts from Google Fonts or `@font-face` with a
`data:` `src`. Nothing else is fetched from anywhere.

## Slides

```html
<section class="slide" id="pricing" data-title="Pricing" data-parent="agenda">…</section>
```

| Attribute | | |
|---|---|---|
| `class="slide"` | required | On a `<section>`. `class="slide"` on any other element does nothing (warning) |
| `id` | required | `^[a-z0-9-]{1,64}$`, unique in the document. Shown in the URL as `#pricing` |
| `data-title` | required | Non-empty. Shown in the slide map |
| `data-parent="<id>"` | optional | B / Backspace goes there; the slide is indented under it in the slide map |
| `data-home` | optional | At most one slide. H goes there, and the status bar shows the hint `H index` |
| `data-private` | optional | Presenter-only slide, see [Private content](#private-content) |

- Slides may sit anywhere in `<body>`; the runtime moves them, in document order, into its stage. That order is the
  order of →/←. At most 200 slides. Slides cannot be nested.
- **Stage**: 1280×720 CSS pixels on a `--paper` background, scaled to fit the window; anything outside it is clipped.
  Lay slides out for exactly that size. Avoid `vw`/`vh` inside slides (they measure the window, not the stage) and don't
  scale or position the stage yourself.

**Slide box.** The runtime's CSS gives every slide this box and shows only the current slide:

```css
.slide { position: absolute; inset: 0; padding: 40px 64px 36px; display: none; flex-direction: column; }
.slide.active { display: flex; }
```

The runtime's stylesheet is linked before your CSS, so yours wins at equal specificity: override the padding with
`.slide { padding: … }` and the visible layout with `.slide.active { display: grid }`. Never set `display` on `.slide`
itself — every slide would show at once. Slides are positioned, so `position: absolute` inside one is relative to the
slide. Slide text inherits `--sans` and `--ink` from `<body>`.

## Links between slides: `data-go`

```html
<button data-go="pricing">Pricing →</button>
<a href="#pricing" data-go="pricing">Pricing →</a>
```

Clicking an element with `data-go="<id>"` goes to that slide; the id must exist. Put it on a `<button>` or an
`<a href="#id">` so it is reachable by keyboard (Tab, then Enter); a `<span>` or an `<a>` without `href` is mouse-only.

A plain `<a href="#pricing">` also works: the runtime follows URL-hash changes to slide ids. A fragment naming any other
element does not change slide; one naming nothing is a warning.

## Toggles: `data-toggle`, `data-toggle-target`, `data-fx`

```html
<button data-toggle="details" data-fx="burst">Show details</button>
<div class="details" data-toggle-target="details">…</div>
<style>.details { display: none } .details.open { display: block }</style>
```

- Toggles start closed. Clicking a `data-toggle="<key>"` trigger (or Enter on it) flips toggle `<key>`: class `open` on
  every `data-toggle-target="<key>"`, `aria-expanded="true|false"` on every trigger. You write the CSS for `.open`.
  `aria-expanded` is absent until the toggle first opens, so style `[aria-expanded="true"]`, not `="false"`.
- Keys match `^[a-z0-9-]{1,32}$`; at most 16 keys per deck; every key needs at least one trigger and one target. Several
  triggers and targets may share a key.
- Toggle state survives slide changes and is synced to viewers (private triggers and targets: see
  [Private content](#private-content)).
- Use a `<button>` as the trigger (or give it `tabindex="0" role="button"`) so it is reachable by keyboard.
- `data-fx="burst"` on a trigger plays a particle burst from it when the toggle opens (skipped under
  `prefers-reduced-motion`). `burst` is the only effect; unknown names are errors, and `data-fx` without `data-toggle`
  on the same element is an error.

## Private content

`data-private` on any element — a slide, a paragraph, a link — removes that element **and its whole subtree** from the
copy served to viewers. Presenters see everything. Use it for speaker notes, backup slides and the links to them.

Public content must not reveal that a private slide exists, nor depend on private content. These are errors:

- a public `data-go`, or a public `<a href="#id">`, pointing at a private slide;
- a public slide whose `data-parent` is a private slide;
- a private home slide (`data-home` + `data-private`);
- a public toggle trigger whose targets are all private: viewers would get a control that does nothing. Private
  triggers with public targets are fine — the presenter opens them for everyone.

**Live sync.** Viewers follow the presenter by default (the status bar lets them browse freely instead) and mirror the
presenter's slide, open toggles, cursor and text selection; cursor and selection are sent in stage coordinates. On
deck.txz.cool viewers may share their cursor too, and selection is shared by everyone who shares their cursor: each
person's highlight shows in their colour, with their name, to everyone on the same slide. There, following viewers
can select text (nothing on the slide reacts to their clicks while they follow); it's shared when they share their
cursor. Private content is never sent:

- presenter on a private slide → viewers stay where they are; toggles flipped meanwhile reach them when the presenter
  is back on a public slide;
- toggle keys whose targets are all private, and text selected inside private content, are never sent.

Position private elements on public slides out of flow, like `.notes { position: absolute; … }` in the example. An
in-flow private element shifts everything after it in the viewers' copy, so the mirrored cursor and selection land in
the wrong place.

Close elements explicitly inside private content: the server-side parser applies no implied end tags, so
`<li data-private>a<li>b` hides both items.

## Keyboard (provided by the runtime)

| Key | Action |
|---|---|
| → · PageDown · Space | Next slide |
| ← · PageUp | Previous slide |
| Home · End | First · last slide |
| H | Home slide (`data-home`) |
| B · Backspace | Parent slide (`data-parent`) |
| O | Slide map |
| Esc | Close the slide map, otherwise leave fullscreen |
| F | Fullscreen |

Content cannot add shortcuts (no scripts) and should not need these keys for anything else. The status bar shows
`← → navigate · H index · O map · F fullscreen`; `H index` only when a slide has `data-home`.

## Theme tokens

The runtime's chrome (status bar, slide map, remote cursor, progress bar) reads these custom properties. Override them in
`:root` (your CSS comes after the runtime's), and use them in your own CSS so slides and chrome match.

| Token | Default | Used for |
|---|---|---|
| `--letterbox` | `#e8e4da` | Page background around the stage |
| `--paper` | `#fbfaf7` | Stage and slide-map background |
| `--box` | `#ffffff` | Raised surfaces (keys, cards) |
| `--ink` | `#18202e` | Text; slides inherit it |
| `--muted` | `#667085` | Secondary text, status bar |
| `--line` | `#e2ddd2` | Borders and rules |
| `--accent` | `#0f766e` | Progress bar, current slide in the map, buttons |
| `--accent-soft` | `#dcf1ec` | Hover and highlight backgrounds |
| `--ui` | `#4f46e5` | Presenter's remote cursor, its name label (white text on `--ui`) and the selection highlight (`--ui` at 22%). Pick a colour with enough contrast for white text |
| `--sans` | `Inter, system-ui, -apple-system, "Segoe UI", sans-serif` | Chrome text; slides inherit it |
| `--mono` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | Page numbers, keys |

## Reserved by the runtime

- **Ids** — content must not use: `stage`, `progress`, `map`, `mgrid`, `mapclose`, `bar`, `prev`, `next`, `pageno`,
  `live`, `rcursor`, `rsel`, `fx`, `deck-config`, `deck-people`, `deck-hands`, `deck-raised`, `deck-cursors`,
  `deck-cursor-bar`, `deck-highlights`.
- **Body classes** — set by the runtime, don't set them yourself: `show-map` (slide map open), `following` (viewer locked
  to the presenter). You may style against them, e.g. `body.following .hint { display: none }`.
- **State classes** — the runtime adds and removes class `active` on slides and class `open` on toggle targets (and sets
  `aria-expanded` on triggers). Don't put `active` or `open` on those elements yourself — the runtime overwrites them —
  and don't write bare `.active { … }` / `.open { … }` rules, which hit the current slide and every open target. Scope
  your own state classes (`.tab.current`, `.more.open`).

## Forbidden

Each of these is a validation error.

| Construct | Why |
|---|---|
| `<script>` (HTML or SVG) | The runtime provides all behaviour; deck pages run under `script-src 'self'` |
| Any attribute starting with `on` (`onclick`, `onload`, … any case); SVG `attributeName="on…"` | Event handlers are scripts |
| `javascript:` / `vbscript:` in `href`, `src`, `xlink:href`, `srcset`, `action`, `formaction`, `poster`, `background` | Scripts. Checked after decoding `&…;` references and removing whitespace and control characters, so `java&#9;script:` is caught |
| `<iframe>` `<frame>` `<frameset>` `<object>` `<embed>` `<applet>` `<portal>` | Embed foreign documents or plugins |
| `<form>` | Decks are read-only; a form could post data elsewhere |
| `<base>` | Rewrites every relative URL, including the runtime's |
| `<meta http-equiv>` | Refreshes, redirects, policy overrides |
| `<link>` other than `rel="preconnect"` to `https://fonts.googleapis.com` / `https://fonts.gstatic.com`, or `rel="stylesheet"` with `href` starting `https://fonts.googleapis.com/css` | Not self-contained |
| `src` that is not `data:image/…`, `data:audio/…` or `data:video/…`; `srcset` with anything but `data:image/…`; `poster` / `background` that is not `data:image/…` | Not self-contained |
| `<a>` / `<area>` `href` other than `https:`, `http:`, `mailto:`, `tel:`, `#fragment` or a relative path | Unexpected schemes |
| `href` / `xlink:href` on any other element (SVG `<use>`, `<image>`, …) other than `#fragment` or `data:image/…`; SVG `attributeName` animating `href` | Not self-contained / script |
| CSS (in `<style>` and `style=""`): `@import` other than `https://fonts.googleapis.com/css…`; `url()` / `src()` other than `data:` or `#fragment`; `expression()`; `javascript:` | Not self-contained / script. CSS escapes (`@\69mport`) and comments are resolved first |
| Reserved ids; `show-map` / `following` on `<body>` | Collide with the runtime |

Fine to use: inline `<svg>` (with `<defs>`, `<use href="#…">`, markers, gradients), `<canvas>` (stays blank),
`<details>`, `<style>` blocks, `<a target="_blank">`, `data:` fonts in `@font-face`, CSS animations and transitions.

## Conversion checklist

For turning an existing HTML presentation (or any page) into Deck HTML v1:

1. **Head**: add `<meta name="deck:spec" content="1">`, a `<title>`, and optionally `deck:presenter` / `deck:subtitle`.
2. **Slides**: make each slide a top-level `<section class="slide" id="…" data-title="…">` in presentation order. Ids
   are lowercase kebab-case. Unwrap nested slides and drop wrapper elements that only existed to scale or position
   slides (a `#stage`, `.reveal`, `.deck`).
3. **Scripts**: delete every `<script>` and every `on…` attribute, then re-express the behaviour:
   - links and buttons that jump to a slide → `<button data-go="<id>">` or `<a href="#<id>" data-go="<id>">`;
   - show/hide, accordions, "reveal more" → `data-toggle` + `data-toggle-target` + CSS for `.open`;
   - prev/next buttons, progress bars, page numbers, slide menus, keyboard handlers, fullscreen buttons → delete, the
     runtime provides them;
   - anything else (charts drawn by JS, live data) → bake it into static HTML/SVG or an image.
4. **Structure**: set `data-parent` on detail slides and `data-home` on the index/agenda slide, if there is one.
5. **Names**: rename ids that clash with the reserved list; make all ids unique (watch duplicated SVG `<defs>`); rename
   the source's own `active` / `open` state classes and bare `.active` / `.open` rules.
6. **Assets**: inline images as `data:` URIs (base64, or URL-encoded SVG); move external CSS into `<style>`; keep only
   Google Fonts links, or embed fonts as `data:` in `@font-face`; remove favicons, preloads and other `<link>`s.
7. **Layout**: size everything for a 1280×720 stage; replace `vw`/`vh` and window-based scaling inside slides; make
   sure `.slide` itself never sets `display`.
8. **Privacy**: mark speaker notes and backup material `data-private` and position notes on public slides absolutely;
   check that no public element links to a private slide.
9. **Theme**: map the deck's colours and fonts onto the tokens in `:root` so the chrome matches.
10. **Validate** until there are no errors; read the warnings.

## Validating

```sh
bun run validate path/to/deck.html                # ✓/✗ per file, errors, warnings, slide count
bun run validate path/to/deck.html --json         # [{ file, ok, errors, warnings, meta }]
```

The exit code is 1 when any file has errors. The admin's upload runs the same validator (`POST /admin/api/validate`
for a dry run); a deck with errors is rejected with the report. Warnings never block.

Each issue is `{ rule, message }`; the message names the element and the slide it is in, e.g.
`<button> in #intro: data-go="pricng" is not a slide id`.

| Rule | |
|---|---|
| `size` | Over 5 MB |
| `parse` | The document could not be parsed |
| `spec` | `deck:spec` missing or not `1` |
| `title` | Warning: no `<title>` |
| `slides` | No slides, or more than 200 |
| `slide` | Bad slide id, empty `data-title`, nested slide |
| `slide-tag` | Warning: `class="slide"` on something other than `<section>` |
| `slide-attr` | `data-parent` / `data-home` outside a slide |
| `id` | Duplicate or reserved id |
| `reserved-class` | Runtime class on `<body>` |
| `ref` | `data-go` / `data-parent` names no slide. Warning: a public `<a href="#x">` names no slide or element id |
| `home` | More than one `data-home` |
| `private` | Public content reveals a private slide, or the home slide is private |
| `toggle` | Bad key, more than 16 keys, key without trigger or target, public trigger whose targets are all private |
| `fx` | Unknown effect, or `data-fx` without `data-toggle` |
| `element` | Forbidden element |
| `event-handler` | `on…` attribute |
| `url` | Disallowed URL in an attribute |
| `link` | Disallowed `<link>` |
| `css` | Disallowed `@import`, `url()`, `expression()` or script URL in CSS |

## Uploading

1. Open `https://deck.txz.cool/admin` and drop the file; it is validated as above.
2. Pick a slug, which makes the address `https://deck.txz.cool/<slug>`: `^[a-z0-9][a-z0-9-]{0,47}$` and not one of
   `admin` `api` `runtime` `login` `logout` `ws` `join` `static` `assets` `health`.
3. Set a viewer password and a presenter password (required for a new deck, at least 6 characters). Viewers sign in
   with the first; you present with the second.

Uploading to an existing slug replaces the live deck: the previous version is archived (the last 10 are kept) and
every open copy, the presenter's included, reloads. Rolling back restores any archived version and archives the one it
replaces, so a rollback can be undone.
