// Inline the local images, audio, video and fonts a deck references as data: URIs, rewriting the deck in place.
// Usage: bun inline-assets.ts <deck.html> [--base <dir>]   (relative paths resolve against --base, default: the deck's folder)
import { dirname, extname, resolve } from "node:path"

const MIME: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf"
}
const LIMIT = 5 * 1024 * 1024
// Style attribute values arrive undecoded, so `&quot;` counts as a quote too.
const CSS_URL = /url\(\s*(&quot;|&#39;|["']?)(.*?)\1\s*\)/g
const STYLE_BLOCK = /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi

const args = process.argv.slice(2)
const deck = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--base")
if (!deck) throw new Error("usage: bun inline-assets.ts <deck.html> [--base <dir>]")
const baseArg = args.includes("--base") ? args[args.indexOf("--base") + 1] : undefined
const base = resolve(baseArg ?? dirname(resolve(deck)))

const isInlineable = (url: string) => !/^(data:|#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(url.trim()) && url.trim() !== ""
const isRemote = (url: string) => /^(https?:)?\/\//i.test(url.trim()) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(url.trim())

const html = await Bun.file(deck).text()
const found = new Set<string>()
const remote = new Set<string>()
const note = (url: string) => (isInlineable(url) ? found.add(url.trim()) : isRemote(url) && remote.add(url.trim()))
const cssUrls = (css: string) => {
    for (const match of css.matchAll(CSS_URL)) note(match[2] ?? "")
}

for (const [, , css = ""] of html.matchAll(STYLE_BLOCK)) cssUrls(css)
const collect = new HTMLRewriter()
    .on("[src], [poster]", { element: el => [el.getAttribute("src"), el.getAttribute("poster")].forEach(url => url && note(url)) })
    .on("image", { element: el => [el.getAttribute("href"), el.getAttribute("xlink:href")].forEach(url => url && note(url)) })
    .on("[style]", { element: el => cssUrls(el.getAttribute("style") ?? "") })
await collect.transform(new Response(html)).text()

const data = new Map<string, string>()
const missing: string[] = []
for (const url of found) {
    const path = resolve(base, decodeURIComponent(url.split(/[?#]/)[0] ?? url))
    const type = MIME[extname(path).toLowerCase()]
    const file = Bun.file(path)
    if (!type || !(await file.exists())) missing.push(`${url}${type ? "" : " (unknown type)"}`)
    else data.set(url, `data:${type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`)
}

let droppedSrcset = 0
const swap = (url: string) => data.get(url.trim()) ?? url
const swapCss = (css: string) => css.replace(CSS_URL, (match, _quote, url) => (data.has(url.trim()) ? `url(${swap(url)})` : match))
const rewrite = new HTMLRewriter()
    .on("[src], [poster]", {
        element: el => ["src", "poster"].forEach(name => el.hasAttribute(name) && el.setAttribute(name, swap(el.getAttribute(name) ?? "")))
    })
    .on("image", { element: el => ["href", "xlink:href"].forEach(name => el.hasAttribute(name) && el.setAttribute(name, swap(el.getAttribute(name) ?? ""))) })
    .on("[style]", { element: el => el.setAttribute("style", swapCss(el.getAttribute("style") ?? "")) })
    .on("[srcset]", {
        element: el => {
            if ((el.getAttribute("srcset") ?? "").trim().startsWith("data:")) return
            el.removeAttribute("srcset")
            droppedSrcset++
        }
    })
const output = await rewrite.transform(new Response(html.replace(STYLE_BLOCK, (_, open, css, close) => open + swapCss(css) + close))).text()
await Bun.write(deck, output)

const kb = (n: number) => `${Math.round(n / 1024)} KB`
const size = new TextEncoder().encode(output).byteLength
const biggest = [...data].sort((a, b) => b[1].length - a[1].length).slice(0, 5)
console.log(`inlined ${data.size} file(s)${biggest.length ? `; largest: ${biggest.map(([url, uri]) => `${url} ${kb(uri.length)}`).join(", ")}` : ""}`)
if (droppedSrcset) console.log(`removed ${droppedSrcset} srcset attribute(s); the data: src stays`)
if (remote.size) console.log(`remote, not inlined (download with the user's OK, then re-run): ${[...remote].join(", ")}`)
if (missing.length) console.log(`not found, not inlined: ${missing.join(", ")}`)
console.log(`${deck}: ${(size / 1024 / 1024).toFixed(2)} MB${size > LIMIT ? " — OVER the 5 MB limit: shrink the largest images" : ""}`)
