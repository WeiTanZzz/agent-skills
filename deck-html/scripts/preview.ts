// Lay every slide of a deck out as a 1280×720 frame, stacked, so overflow is visible in a screenshot.
// Content that crosses a dashed frame does not fit the stage. Private elements get an amber outline.
// Usage: bun preview.ts <deck.html> [--open] [--viewer] [--out <file>]
//   --open    add class "open" to every toggle target (check that opened toggles still fit)
//   --viewer  drop [data-private] elements and slides, as the server does for viewers
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

const args = process.argv.slice(2)
const deck = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--out")
if (!deck) throw new Error("usage: bun preview.ts <deck.html> [--open] [--viewer] [--out <file>]")
const open = args.includes("--open")
const viewer = args.includes("--viewer")
const suffix = `${open ? ".open" : ""}${viewer ? ".viewer" : ""}`
const out = args.includes("--out")
    ? (args[args.indexOf("--out") + 1] ?? "")
    : join(tmpdir(), "deck-preview", `${basename(deck, ".html")}${suffix}.preview.html`)

const css = `<style>
html,body{margin:0!important;height:auto!important;overflow:auto!important;background:#3a3f4b!important}
body{padding:48px 0 8px!important}
section.slide{position:relative!important;inset:auto!important;width:1280px!important;height:720px!important;margin:0 auto 64px!important;overflow:visible!important;outline:2px dashed #f43f5e;transform:none!important}
section.slide::after{content:"#" attr(id);position:absolute;left:0;top:-28px;font:600 14px/1 ui-monospace,monospace;color:#fff}
[data-private]:not(section){outline:2px dashed #f59e0b;outline-offset:2px}
</style>`

const addClass = (el: Element, name: string) => el.setAttribute("class", `${el.getAttribute("class") ?? ""} ${name}`.trim())
let styled = false
let rewriter = new HTMLRewriter()
    .on("head", {
        element: el => {
            el.append(css, { html: true })
            styled = true
        }
    })
    .on("section.slide", { element: el => addClass(el, "active") })
if (open) {
    rewriter = rewriter
        .on("[data-toggle-target]", { element: el => addClass(el, "open") })
        .on("[data-toggle]", { element: el => el.setAttribute("aria-expanded", "true") })
}
if (viewer) rewriter = rewriter.on("[data-private]", { element: el => el.remove() })

const html = await rewriter.transform(new Response(await Bun.file(deck).text())).text()
await Bun.write(out, styled ? html : css + html)
console.log(out)
