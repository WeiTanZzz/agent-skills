#!/usr/bin/env bun
// Generated from the deck platform's SPEC.md and validator by `bun run skill:sync`. Do not edit by hand.
// @bun
// src/shared/spec.ts
var SPEC_VERSION = "1";
var SLIDE_ID = /^[a-z0-9-]{1,64}$/;
var TOGGLE_KEY = /^[a-z0-9-]{1,32}$/;
var MAX_TOGGLES = 16;
var MAX_DECK_BYTES = 5 * 1024 * 1024;
var MAX_SLIDES = 200;
var FX = ["burst"];
var RESERVED_IDS = [
  "stage",
  "progress",
  "map",
  "mgrid",
  "mapclose",
  "bar",
  "prev",
  "next",
  "pageno",
  "live",
  "rcursor",
  "rsel",
  "fx",
  "deck-config",
  "deck-people",
  "deck-hands",
  "deck-raised",
  "deck-cursors",
  "deck-cursor-bar",
  "deck-highlights"
];
var RESERVED_BODY_CLASSES = ["show-map", "following"];
var DEFAULT_PRESENTER = "Presenter";

// src/spec/validate.ts
var HTML_NS = "http://www.w3.org/1999/xhtml";
var FORBIDDEN_ELEMENTS = new Set(["script", "iframe", "frame", "frameset", "object", "embed", "applet", "base", "form", "portal"]);
var URL_ATTRIBUTES = new Set(["href", "xlink:href", "src", "srcset", "action", "formaction", "poster", "background"]);
var LINK_SCHEMES = new Set(["https", "http", "mailto", "tel"]);
var FONT_ORIGINS = new Set(["https://fonts.googleapis.com", "https://fonts.gstatic.com"]);
var FONT_CSS = "https://fonts.googleapis.com/css";
var ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\xA0", Tab: "\t", NewLine: `
`, colon: ":" };
var SCRIPT_URL = /(?:java|vb)script:/;
var CSS_COMMENT = /("(?:[^"\\\n]|\\[\s\S])*"|'(?:[^'\\\n]|\\[\s\S])*')|\/\*[\s\S]*?\*\//g;
var CSS_ESCAPE = /\\([0-9a-f]{1,6}[ \t\r\n\f]?|[\s\S])/gi;
var CSS_IMPORT = /@import\s*(?:url\(\s*)?(?:"([^"]*)"|'([^']*)'|([^"'\s;)]*))/g;
var CSS_URL = /\b(?:url|src)\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))/g;
var short = (value) => value.length > 60 ? `${value.slice(0, 57)}\u2026` : value;
var codePoint = (code) => code > 0 && code <= 1114111 && (code < 55296 || code > 57343) ? String.fromCodePoint(code) : "\uFFFD";
var decode = (value) => value.replace(/&(?:#x([0-9a-f]+);?|#(\d+);?|([a-z]+);)/gi, (match, hex, dec, name) => hex ? codePoint(Number.parseInt(hex, 16)) : dec ? codePoint(Number(dec)) : ENTITIES[name] ?? match);
var clean = (url) => url.replace(/[\u0000-\u0020\u007f]/g, "").toLowerCase();
var scheme = (url) => /^([a-z][a-z0-9+.-]*):/.exec(url)?.[1];
var isFragment = (url) => url.startsWith("#");
var isDataImage = (url) => url.startsWith("data:image/");
var isDataMedia = (url) => /^data:(?:image|audio|video)\//.test(url);
var isLinkUrl = (url) => {
  const name = scheme(url);
  return name === undefined || LINK_SCHEMES.has(name);
};
var srcsetUrls = (srcset) => {
  const urls = [];
  const candidate = /[\s,]*([^\s,]\S*)/g;
  for (let match = candidate.exec(srcset);match; match = candidate.exec(srcset)) {
    const url = match[1] ?? "";
    urls.push(url.replace(/,+$/, ""));
    if (url.endsWith(","))
      continue;
    const comma = srcset.indexOf(",", candidate.lastIndex);
    if (comma < 0)
      break;
    candidate.lastIndex = comma + 1;
  }
  return urls;
};
var urlProblem = (tag, attribute, value) => {
  const url = clean(value);
  if (SCRIPT_URL.test(url))
    return "script URLs are not allowed";
  if (attribute === "srcset")
    return srcsetUrls(value).every((candidate) => isDataImage(clean(candidate))) ? undefined : "srcset may only list data:image URLs";
  if (attribute === "src")
    return isDataMedia(url) ? undefined : "src must be a data:image, data:audio or data:video URL";
  if (attribute === "poster" || attribute === "background")
    return isDataImage(url) ? undefined : `${attribute} must be a data:image URL`;
  if (attribute !== "href" && attribute !== "xlink:href")
    return;
  if (tag === "link")
    return;
  if (tag === "a" || tag === "area")
    return isLinkUrl(url) ? undefined : "links may only use https:, http:, mailto:, tel:, #fragment or relative URLs";
  return isFragment(url) || isDataImage(url) ? undefined : `${attribute} must be a #fragment or a data:image URL`;
};
var cssProblems = (css) => {
  const source = css.replace(CSS_COMMENT, (_, string) => string ?? "").replace(CSS_ESCAPE, (_, escaped) => /^[0-9a-f]/i.test(escaped) ? codePoint(Number.parseInt(escaped, 16)) : escaped === `
` ? "" : escaped).toLowerCase();
  const problems = [];
  for (const match of source.matchAll(CSS_IMPORT)) {
    const target = clean(match[1] ?? match[2] ?? match[3] ?? "");
    if (!target.startsWith(FONT_CSS))
      problems.push(`@import "${short(target)}" is not Google Fonts CSS`);
  }
  for (const match of source.replace(CSS_IMPORT, "").matchAll(CSS_URL)) {
    const target = clean(match[1] ?? match[2] ?? match[3] ?? "");
    if (!target.startsWith("data:") && !isFragment(target))
      problems.push(`url(${short(target)}) is not a data: or #fragment URL`);
  }
  if (/expression\s*\(/.test(source))
    problems.push("expression() is not allowed");
  if (SCRIPT_URL.test(source))
    problems.push("script URLs are not allowed");
  return problems;
};
var isAllowedLink = (rel, href) => rel === "preconnect" && FONT_ORIGINS.has(href.replace(/\/$/, "")) || rel === "stylesheet" && href.startsWith(FONT_CSS);
var attr = (element, name) => {
  const value = element.getAttribute(name);
  return value === null ? undefined : decode(value);
};
var classesOf = (element) => (attr(element, "class") ?? "").split(/\s+/).filter(Boolean);
var describe = (element, slide) => {
  const id = attr(element, "id");
  const className = attr(element, "class")?.trim();
  const label = id !== undefined ? ` id="${short(id)}"` : className ? ` class="${short(className)}"` : "";
  return `<${element.tagName}${label}>${slide ? ` in #${slide}` : ""}`;
};
var onClose = (element, handler) => {
  try {
    element.onEndTag(handler);
    return true;
  } catch {
    return false;
  }
};
var collapse = (text) => text.replace(/\s+/g, " ").trim();
var report = (errors, warnings, meta = { title: "", presenter: DEFAULT_PRESENTER, slides: [], toggles: [] }) => ({
  ok: errors.length === 0,
  errors,
  warnings,
  meta
});
var validateDeck = async (html) => {
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });
  const bytes = new TextEncoder().encode(html).byteLength;
  if (bytes > MAX_DECK_BYTES) {
    error("size", `deck is ${(bytes / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_DECK_BYTES / 1024 / 1024} MB`);
    return report(errors, warnings);
  }
  const open = [];
  const slides = [];
  const ids = new Set;
  const links = [];
  const triggers = new Set;
  const targets = new Set;
  const publicTriggers = new Map;
  const publicTargets = new Set;
  const toggleKeys = new Set;
  const meta = new Map;
  let title;
  let readingTitle = false;
  let css = "";
  const toggle = (key, attribute, keys, where) => {
    if (key === undefined)
      return;
    if (TOGGLE_KEY.test(key)) {
      keys.add(key);
      toggleKeys.add(key);
    } else
      error("toggle", `${where}: ${attribute}="${short(key)}" must match ${TOGGLE_KEY}`);
  };
  const element = (el) => {
    const parent = open.at(-1);
    const tag = el.tagName.toLowerCase();
    const id = attr(el, "id");
    const classes = classesOf(el);
    const isSlide = tag === "section" && classes.includes("slide");
    const isPrivate = (parent?.isPrivate ?? false) || el.hasAttribute("data-private");
    const where = describe(el, parent?.slide);
    if (FORBIDDEN_ELEMENTS.has(tag))
      error("element", `${where} is not allowed`);
    if (tag === "meta" && el.hasAttribute("http-equiv"))
      error("element", `${where}: http-equiv is not allowed`);
    for (const [rawName = "", raw = ""] of el.attributes) {
      const name = rawName.toLowerCase();
      const value = decode(raw);
      if (name.startsWith("on"))
        error("event-handler", `${where}: event handler attribute "${name}" is not allowed`);
      else if (name === "style")
        for (const problem of cssProblems(value))
          error("css", `${where} style attribute: ${problem}`);
      else if (name === "attributename" && /^\s*on|href\s*$/i.test(value)) {
        error(/^\s*on/i.test(value) ? "event-handler" : "url", `${where}: animating "${value.trim()}" is not allowed`);
      } else if (URL_ATTRIBUTES.has(name)) {
        const problem = urlProblem(tag, name, value);
        if (problem)
          error("url", `${where}: ${name}="${short(raw)}" \u2014 ${problem}`);
      }
    }
    if (tag === "link") {
      const rel = (attr(el, "rel") ?? "").trim().toLowerCase();
      const href2 = el.getAttribute("href") ?? "";
      if (!isAllowedLink(rel, clean(decode(href2))))
        error("link", `${where}: rel="${rel}" href="${short(href2)}" \u2014 only Google Fonts stylesheets and preconnects are allowed`);
    }
    if (tag === "meta") {
      const name = attr(el, "name")?.trim().toLowerCase();
      if (name?.startsWith("deck:") && !meta.has(name))
        meta.set(name, attr(el, "content")?.trim() ?? "");
    }
    if (tag === "body") {
      for (const name of classes.filter((name2) => RESERVED_BODY_CLASSES.includes(name2)))
        error("reserved-class", `${where}: class "${name}" is set by the runtime`);
    }
    if (id !== undefined) {
      if (RESERVED_IDS.includes(id))
        error("id", `${where}: id "${id}" is reserved by the runtime`);
      else if (ids.has(id))
        error("id", `${where}: duplicate id "${short(id)}"`);
      ids.add(id);
    }
    if (isSlide) {
      if (parent?.slide !== undefined)
        error("slide", `${where}: slides cannot be nested`);
      if (!SLIDE_ID.test(id ?? ""))
        error("slide", `${where}: slide id must match ${SLIDE_ID}`);
      const slideTitle = collapse(attr(el, "data-title") ?? "");
      if (!slideTitle)
        error("slide", `${where} has no data-title`);
      slides.push({ id: id ?? "", title: slideTitle, parent: attr(el, "data-parent"), home: el.hasAttribute("data-home"), private: isPrivate });
    } else {
      if (el.hasAttribute("data-parent") || el.hasAttribute("data-home"))
        error("slide-attr", `${where}: data-parent and data-home belong on slides`);
      if (classes.includes("slide"))
        warnings.push({ rule: "slide-tag", message: `${where} has class "slide" but only <section class="slide"> is a slide` });
    }
    const go = attr(el, "data-go");
    if (go !== undefined)
      links.push({ attribute: "data-go", target: go, isPrivate, where });
    const href = attr(el, "href")?.trim();
    if ((tag === "a" || tag === "area") && href?.startsWith("#"))
      links.push({ attribute: "href", target: href.slice(1), isPrivate, where });
    const trigger = attr(el, "data-toggle");
    const target = attr(el, "data-toggle-target");
    toggle(trigger, "data-toggle", triggers, where);
    toggle(target, "data-toggle-target", targets, where);
    if (!isPrivate && trigger !== undefined && !publicTriggers.has(trigger))
      publicTriggers.set(trigger, where);
    if (!isPrivate && target !== undefined)
      publicTargets.add(target);
    const fx = attr(el, "data-fx");
    if (fx !== undefined && trigger === undefined)
      error("fx", `${where}: data-fx only works on a data-toggle element`);
    else if (fx !== undefined && !FX.some((name) => name === fx))
      error("fx", `${where}: unknown data-fx "${short(fx)}" (known: ${FX.join(", ")})`);
    const frame = { isPrivate, slide: isSlide ? id ?? "" : parent?.slide };
    if (onClose(el, () => open.pop()))
      open.push(frame);
  };
  try {
    await new HTMLRewriter().on("*", { element }).on("title", {
      element: (el) => {
        readingTitle = title === undefined && el.namespaceURI === HTML_NS;
        if (readingTitle)
          title = "";
      },
      text: (chunk) => {
        if (readingTitle)
          title = (title ?? "") + chunk.text;
      }
    }).on("style", {
      text: (chunk) => {
        css += chunk.text;
        if (!chunk.lastInTextNode)
          return;
        for (const problem of cssProblems(css))
          error("css", `<style>: ${problem}`);
        css = "";
      }
    }).transform(new Response(html)).text();
  } catch (cause) {
    error("parse", `the document could not be parsed: ${cause instanceof Error ? cause.message : String(cause)}`);
    return report(errors, warnings);
  }
  const spec = meta.get("deck:spec");
  if (spec === undefined)
    error("spec", `missing <meta name="deck:spec" content="${SPEC_VERSION}">`);
  else if (spec !== SPEC_VERSION)
    error("spec", `deck:spec is "${short(spec)}"; this platform supports "${SPEC_VERSION}"`);
  if (slides.length === 0)
    error("slides", `no slides: add <section class="slide" id="\u2026" data-title="\u2026">`);
  if (slides.length > MAX_SLIDES)
    error("slides", `${slides.length} slides; the limit is ${MAX_SLIDES}`);
  const slideById = new Map(slides.map((slide) => [slide.id, slide]));
  const homes = slides.filter((slide) => slide.home);
  if (homes.length > 1)
    error("home", `${homes.length} slides have data-home (${homes.map((slide) => `"${slide.id}"`).join(", ")}); at most one may`);
  for (const home of homes.filter((slide) => slide.private))
    error("private", `home slide "${home.id}" must not be private`);
  for (const slide of slides) {
    if (slide.parent === undefined)
      continue;
    const parent = slideById.get(slide.parent);
    if (!parent)
      error("ref", `slide "${slide.id}" data-parent="${short(slide.parent)}" is not a slide id`);
    else if (parent.private && !slide.private)
      error("private", `public slide "${slide.id}" has private data-parent "${parent.id}"`);
  }
  for (const link of links) {
    const target = slideById.get(link.target);
    if (!target && link.attribute === "data-go")
      error("ref", `${link.where}: data-go="${short(link.target)}" is not a slide id`);
    else if (!target && !link.isPrivate && !ids.has(link.target))
      warnings.push({ rule: "ref", message: `${link.where}: href="#${short(link.target)}" names no slide or element id` });
    else if (target?.private && !link.isPrivate)
      error("private", `${link.where}: public ${link.attribute} points at private slide "${target.id}"`);
  }
  const toggles = [...toggleKeys];
  if (toggles.length > MAX_TOGGLES)
    error("toggle", `${toggles.length} toggle keys; the limit is ${MAX_TOGGLES}`);
  for (const key of toggles) {
    if (!triggers.has(key))
      error("toggle", `toggle "${key}" has a data-toggle-target but no data-toggle trigger`);
    if (!targets.has(key))
      error("toggle", `toggle "${key}" has a data-toggle trigger but no data-toggle-target`);
    const publicTrigger = publicTriggers.get(key);
    if (publicTrigger && targets.has(key) && !publicTargets.has(key))
      error("toggle", `${publicTrigger}: every data-toggle-target="${key}" is private, so viewers get a toggle that does nothing`);
  }
  const documentTitle = collapse(decode(title ?? ""));
  if (!documentTitle)
    warnings.push({ rule: "title", message: "missing or empty <title>; the first slide's title is used instead" });
  const subtitle = meta.get("deck:subtitle");
  return report(errors, warnings, {
    title: documentTitle || slides[0]?.title || "",
    presenter: meta.get("deck:presenter") || DEFAULT_PRESENTER,
    ...subtitle ? { subtitle } : {},
    slides,
    toggles
  });
};

// scripts/validate.ts
var args = process.argv.slice(2);
var json = args.includes("--json");
var files = args.filter((arg) => arg !== "--json");
if (files.length === 0) {
  console.error("usage: validate <deck.html...> [--json]");
  process.exit(1);
}
var missing = (await Promise.all(files.map(async (file) => await Bun.file(file).exists() ? [] : [file]))).flat();
if (missing.length > 0) {
  console.error(`not found: ${missing.join(", ")}`);
  process.exit(1);
}
var results = await Promise.all(files.map(async (file) => ({ file, ...await validateDeck(await Bun.file(file).text()) })));
var count = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;
if (json)
  console.log(JSON.stringify(results, null, 2));
else {
  for (const { file, ok, errors, warnings, meta } of results) {
    console.log(`${ok ? "\u2713" : "\u2717"} ${file} \u2014 ${count(meta.slides.length, "slide")}, ${count(errors.length, "error")}, ${count(warnings.length, "warning")}`);
    for (const issue of errors)
      console.log(`  error   [${issue.rule}] ${issue.message}`);
    for (const issue of warnings)
      console.log(`  warning [${issue.rule}] ${issue.message}`);
  }
}
process.exit(results.every((result) => result.ok) ? 0 : 1);
