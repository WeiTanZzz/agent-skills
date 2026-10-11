#!/usr/bin/env bun
// Renders a case-study deck spec (references/deck-spec.md) into one Deck HTML v1 file.
// All layout and styling lives here so every deck looks the same.
import { readFileSync, writeFileSync } from "node:fs"

type Visual = { type: string; [key: string]: any }
type Slide = { id: string; title: string; kicker: string; answers: string[]; body: string; visuals: Visual[]; notes: string }
type Box = { id: string; lane: number; x: number; y: number; w: number; h: number; label: string[]; sub: string[] }

const SLIDE_IDS = ["answer", "context", "solution", "tensions", "poc", "production", "delivery"]
const FIELDS = ["title", "kicker", "answers", "body", "visual", "notes"]
const FULL_WIDTH = new Set(["tensions", "production"])
const SERIES = ["var(--accent)", "var(--ui)", "var(--frozen)", "var(--danger)"]

const warnings: string[] = []
const warn = (message: string) => warnings.push(message)

const [specPath, ...args] = Bun.argv.slice(2)
if (!specPath) {
    console.error("usage: bun render.ts <spec.deck.md> [--out <file.html>]")
    process.exit(1)
}
const outFlag = args.indexOf("--out")
const outPath = outFlag >= 0 ? args[outFlag + 1] : `${specPath.replace(/(\.deck)?\.md$/, "")}.html`

// ---------- text ----------

const esc = (s: unknown) =>
    String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string)

const inline = (s: unknown) =>
    esc(s)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]\n]{1,30})\](?!\()/g, '<span class="src">$1</span>')

const boldLabel = (s: string) => (s.startsWith("**") ? s : s.replace(/^([A-Z][\w &/'’-]{0,30}):\s+/, "**$1:** "))

const wordCount = (md: string) =>
    md
        .split("\n")
        .filter(line => !/^\s*[|>]/.test(line))
        .join(" ")
        .replace(/\[[^\]]*\]|[*`#>|-]/g, " ")
        .split(/\s+/)
        .filter(Boolean).length

const wrap = (text: string, max: number, lines: number, where: string) => {
    const out: string[] = []
    let line = ""
    for (const word of text.split(/\s+/).filter(Boolean)) {
        if (!line) line = word
        else if (`${line} ${word}`.length <= max) line += ` ${word}`
        else {
            out.push(line)
            line = word
        }
    }
    if (line) out.push(line)
    if (out.length <= lines) return out
    warn(`${where}: "${text}" is too long and was cut`)
    const kept = out.slice(0, lines)
    kept[lines - 1] = `${out.slice(lines - 1).join(" ").slice(0, Math.max(max - 1, 1))}…`
    return kept
}

const fmt = (n: number) => String(+n.toFixed(2))

// ---------- parsing ----------

const splitHeadings = (text: string, level: number) => {
    const marker = `${"#".repeat(level)} `
    const sections: { name: string; lines: string[] }[] = []
    let fenced = false
    for (const line of text.split("\n")) {
        const isFence = line.trimStart().startsWith("```")
        if (!fenced && !isFence && line.startsWith(marker)) {
            sections.push({ name: line.slice(marker.length).trim(), lines: [] })
            continue
        }
        if (isFence) fenced = !fenced
        sections.at(-1)?.lines.push(line)
    }
    return sections.map(s => ({ name: s.name, body: s.lines.join("\n").trim() }))
}

const parseFields = (text: string) => {
    const fields: Record<string, string> = {}
    let key: string | null = null
    let fenced = false
    for (const line of text.split("\n")) {
        const isFence = line.trimStart().startsWith("```")
        const match = !fenced && !isFence ? line.match(new RegExp(`^(${FIELDS.join("|")}):\\s*(.*)$`)) : null
        if (isFence) fenced = !fenced
        if (match) {
            key = match[1]
            fields[key] = match[2]
        } else if (key) fields[key] += `\n${line}`
    }
    for (const k of Object.keys(fields)) fields[k] = fields[k].trim()
    return fields
}

const parseVisuals = (text: string, where: string): Visual[] =>
    [...text.matchAll(/```ya?ml\n([\s\S]*?)```/g)].flatMap(m => {
        try {
            const v = Bun.YAML.parse(m[1]) as Visual
            if (v && typeof v.type === "string") return [v]
            warn(`${where}: visual block has no type`)
        } catch (e) {
            warn(`${where}: visual YAML does not parse (${(e as Error).message})`)
        }
        return []
    })

const listItems = (text: string) =>
    text
        .split("\n")
        .filter(line => /^\s*[-*] /.test(line))
        .map(line => line.replace(/^\s*[-*] /, "").trim())

const text = readFileSync(specPath, "utf8")
const frontMatter = text.match(/^---\n([\s\S]*?)\n---\n/)
if (!frontMatter) {
    console.error("spec has no YAML front matter")
    process.exit(1)
}
const meta = Bun.YAML.parse(frontMatter[1]) as Record<string, string>
for (const key of ["client", "deck_title", "governing_thought"]) if (!meta[key]) warn(`front matter: missing ${key}`)

const sections = splitHeadings(text.slice(frontMatter[0].length), 1)
const section = (prefix: string) => sections.find(s => s.name.toLowerCase().startsWith(prefix))?.body ?? ""

const asks = listItems(section("asks")).flatMap(item => {
    const m = item.match(/^(Q\d+):\s*(.*)$/)
    return m ? [{ id: m[1], text: m[2] }] : []
})
if (!asks.length) warn("# Asks: no Qn items found")

const slides: Slide[] = splitHeadings(section("slides"), 2).map(({ name, body }) => {
    const f = parseFields(body)
    for (const field of FIELDS) if (!(field in f)) warn(`slide ${name}: missing ${field}`)
    const title = f.title ?? ""
    if (title.split(/\s+/).length > 12) warn(`slide ${name}: title is over 12 words`)
    return {
        id: name,
        title,
        kicker: f.kicker ?? "",
        answers: (f.answers ?? "").match(/Q\d+/g) ?? [],
        body: f.body ?? "",
        visuals: parseVisuals(f.visual ?? "", `slide ${name}`),
        notes: f.notes ?? ""
    }
})
if (slides.map(s => s.id).join() !== SLIDE_IDS.join())
    warn(`slides must be ${SLIDE_IDS.join(", ")} in that order; got ${slides.map(s => s.id).join(", ")}`)
for (const s of slides) {
    if (!FULL_WIDTH.has(s.id) && wordCount(s.body) > 40) warn(`slide ${s.id}: body is ${wordCount(s.body)} words (aim ≤ 40)`)
    const callouts = s.body.split("\n").filter(l => /^\s*> /.test(l))
    if (callouts.join(" ").split(/\s+/).length > 22) warn(`slide ${s.id}: callout is over 20 words`)
}

const coverage = new Map(asks.map(q => [q.id, slides.flatMap((s, i) => (s.answers.includes(q.id) ? [i + 2] : []))]))
for (const [q, pages] of coverage) if (!pages.length) warn(`${q} is not answered on any slide`)

const qa: { q: string; a: string }[] = []
for (const line of section("q&a").split("\n")) {
    const q = line.match(/^\s*-\s*Q:\s*(.*)$/)
    const a = line.match(/^\s+A:\s*(.*)$/)
    if (q) qa.push({ q: q[1], a: "" })
    else if (a && qa.length) qa[qa.length - 1].a = a[1]
    else if (line.trim() && qa.length && !q) qa[qa.length - 1].a += ` ${line.trim()}`
}

// ---------- markdown blocks ----------

const table = (rows: string[]) => {
    const cells = rows
        .filter(r => !/^\s*\|?\s*:?-{3,}/.test(r))
        .map(r =>
            r
                .trim()
                .replace(/^\||\|$/g, "")
                .split("|")
                .map(c => c.trim())
        )
    const [head, ...rest] = cells
    return `<table class="comp"><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rest
        .map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`
}

const blocks = (md: string) => {
    const lines = md.split("\n")
    let html = ""
    for (let i = 0; i < lines.length; ) {
        const take = (test: (l: string) => boolean) => {
            const out: string[] = []
            while (i < lines.length && test(lines[i])) out.push(lines[i++])
            return out
        }
        if (/^\s*\|/.test(lines[i])) html += table(take(l => /^\s*\|/.test(l)))
        else if (/^\s*> /.test(lines[i])) html += `<div class="callout">${inline(take(l => /^\s*> /.test(l)).map(l => l.replace(/^\s*> /, "")).join(" "))}</div>`
        else if (/^\s*[-*] /.test(lines[i]))
            html += `<ul class="pts">${take(l => /^\s*[-*] /.test(l))
                .map(l => `<li>${inline(boldLabel(l.replace(/^\s*[-*] /, "")))}</li>`)
                .join("")}</ul>`
        else if (lines[i].trim()) html += `<p class="para">${inline(take(l => !!l.trim() && !/^\s*([-*] |\||> )/.test(l)).join(" "))}</p>`
        else i++
    }
    return html
}

// ---------- visuals ----------

const pillars = (v: Visual) => {
    const items = v.items ?? []
    if (items.length !== 3) warn(`pillars: expected 3 items, got ${items.length}`)
    return `<div class="pillars">${items
        .map((p: any, i: number) => `<div class="pillar"><i>0${i + 1}</i><h3>${inline(p.head)}</h3><p>${inline(p.text)}</p></div>`)
        .join("")}</div>`
}

const metrics = (v: Visual) => {
    const items = v.items ?? []
    if (items.length > 4) warn(`metrics: ${items.length} items (max 4)`)
    return `<div class="metrics">${items
        .map(
            (m: any, i: number) =>
                `<div class="metric${items.length % 2 && i === items.length - 1 ? " wide" : ""}"><b>${inline(m.value)}</b><span>${inline(m.label)}${
                    m.source ? ` <span class="src">${esc(m.source)}</span>` : ""
                }</span></div>`
        )
        .join("")}</div>`
}

const figure = (svg: string, head?: string, caption?: string) =>
    `<figure class="dg">${head ? `<div class="ft">${inline(head)}</div>` : ""}${svg}${caption ? `<figcaption>${inline(caption)}</figcaption>` : ""}</figure>`

const niceCeil = (v: number) => {
    if (v <= 0) return 1
    const p = 10 ** Math.floor(Math.log10(v))
    return ([1, 2, 2.5, 5, 10].find(m => m * p >= v) ?? 10) * p
}

const chart = (v: Visual) => {
    const W = 640, H = 360, L = 48, R = 12, T = 30, B = 34
    const xs: string[] = (v.x ?? []).map(String)
    const series: { name: string; values: number[] }[] = (v.series ?? []).slice(0, 4)
    const top = niceCeil(Math.max(0, ...series.flatMap(s => (s.values ?? []).map(Number))))
    const pw = W - L - R, ph = H - T - B, gw = pw / Math.max(xs.length, 1)
    const y = (val: number) => T + ph - (val / top) * ph
    let svg = ""
    for (let k = 0; k <= 4; k++) {
        const val = (top * k) / 4
        svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(val)}" y2="${y(val)}"/><text class="xs e" x="${L - 8}" y="${y(val) + 4}">${fmt(val)}</text>`
    }
    series.forEach((s, si) => {
        const color = SERIES[si]
        const values = (s.values ?? []).map(Number)
        if (values.length !== xs.length) warn(`chart "${v.title ?? ""}": series ${s.name} has ${values.length} values for ${xs.length} x labels`)
        if (v.kind === "line") {
            const pts = values.map((val, i) => [L + gw * (i + 0.5), y(val)])
            svg += `<polyline class="sl" style="stroke:${color}" points="${pts.map(p => p.join(",")).join(" ")}"/>`
            svg += pts.map(([px, py], i) => `<circle cx="${px}" cy="${py}" r="4" style="fill:${color}"/><text class="xs c" x="${px}" y="${py - 9}">${fmt(values[i])}</text>`).join("")
        } else {
            const bw = Math.min(46, (gw * 0.72) / series.length)
            values.forEach((val, i) => {
                const bx = L + gw * i + (gw - bw * series.length) / 2 + si * bw
                svg += `<rect x="${bx}" y="${y(val)}" width="${bw - 2}" height="${T + ph - y(val)}" rx="3" style="fill:${color}"/><text class="xs c" x="${bx + bw / 2 - 1}" y="${y(val) - 6}">${fmt(val)}</text>`
            })
        }
    })
    svg += xs.map((x, i) => `<text class="s c" x="${L + gw * (i + 0.5)}" y="${H - 10}">${esc(x)}</text>`).join("")
    if (series.length > 1)
        svg += series
            .map((s, si) => `<rect x="${W - R - 120}" y="${2 + si * 16}" width="10" height="10" rx="2" style="fill:${SERIES[si]}"/><text class="xs" x="${W - R - 104}" y="${11 + si * 16}">${esc(s.name)}</text>`)
            .join("")
    const caption = [v.note, v.source ? `[${v.source}]` : ""].filter(Boolean).join(" ")
    return figure(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.title)}">${svg}</svg>`, v.title, caption)
}

const diagram = (v: Visual) => {
    const PAD = 20, GAP = 36, LANE_GAP = 46, LANE_PAD = 18, LABEL_W = 164
    const W = Math.min(980, Math.max(600, LABEL_W + Math.max(1, ...(v.lanes ?? []).map((l: any) => (l.nodes ?? []).length)) * 196 + PAD))
    const area = W - LABEL_W - PAD
    const highlight = new Set<string>(v.highlight ?? [])
    const retire = new Set<string>(v.retire ?? [])
    const boxes = new Map<string, Box>()
    const lanes: { name: string; y: number; h: number; ids: string[] }[] = []
    let top = 4
    ;(v.lanes ?? []).forEach((lane: any, li: number) => {
        const nodes: any[] = lane.nodes ?? []
        const n = Math.max(nodes.length, 1)
        const w = Math.min(180, (area - GAP * (n - 1)) / n)
        const labels = nodes.map(nd => wrap(String(nd.label ?? nd.id), Math.floor((w - 14) / 8), 2, `diagram node ${nd.id}`))
        const subs = nodes.map(nd => (nd.sub ? wrap(String(nd.sub), Math.floor((w - 14) / 6.6), 2, `diagram node ${nd.id}`) : []))
        const h = Math.max(50, ...nodes.map((_, i) => 22 + labels[i].length * 17 + subs[i].length * 15))
        const x0 = LABEL_W + (area - (n * w + (n - 1) * GAP)) / 2
        nodes.forEach((nd, i) => boxes.set(nd.id, { id: nd.id, lane: li, x: x0 + i * (w + GAP), y: top + LANE_PAD, w, h, label: labels[i], sub: subs[i] }))
        lanes.push({ name: lane.name ?? "", y: top, h: h + LANE_PAD * 2, ids: nodes.map(nd => nd.id) })
        top += h + LANE_PAD * 2 + LANE_GAP
    })
    const H = top - LANE_GAP + 8

    type Edge = { from: Box; to: Box; label?: string; dashed?: boolean; kind: "cross" | "side" | "over"; x1: number; x2: number; gy: number }
    const edges: Edge[] = (v.edges ?? []).flatMap((e: any) => {
        const from = boxes.get(e.from), to = boxes.get(e.to)
        if (!from || !to) {
            warn(`diagram edge ${e.from} → ${e.to}: unknown node`)
            return []
        }
        if (Math.abs(from.lane - to.lane) > 1) warn(`diagram edge ${e.from} → ${e.to} skips a lane and will cross other nodes`)
        const ids = lanes[from.lane].ids
        const kind = from.lane !== to.lane ? "cross" : Math.abs(ids.indexOf(from.id) - ids.indexOf(to.id)) === 1 ? "side" : "over"
        return [{ from, to, label: e.label, dashed: e.dashed, kind, x1: 0, x2: 0, gy: 0 }]
    })

    const ports = new Map<string, { edge: Edge; end: "x1" | "x2"; other: Box }[]>()
    const addPort = (box: Box, side: string, edge: Edge, end: "x1" | "x2", other: Box) => {
        const key = `${box.id}:${side}`
        ports.set(key, [...(ports.get(key) ?? []), { edge, end, other }])
    }
    for (const e of edges) {
        if (e.kind === "side") continue
        const down = e.from.lane < e.to.lane
        addPort(e.from, e.kind === "over" || !down ? "top" : "bottom", e, "x1", e.to)
        addPort(e.to, e.kind === "over" || down ? "top" : "bottom", e, "x2", e.from)
    }
    for (const [key, list] of ports) {
        const box = boxes.get(key.split(":")[0]) as Box
        list.sort((a, b) => a.other.x - b.other.x)
        list.forEach((p, k) => (p.edge[p.end] = box.x + (box.w * (k + 1)) / (list.length + 1)))
    }
    const channels = new Map<number, Edge[]>()
    for (const e of edges.filter(e => e.kind === "cross")) {
        const gap = Math.min(e.from.lane, e.to.lane)
        channels.set(gap, [...(channels.get(gap) ?? []), e])
    }
    for (const [gap, list] of channels) {
        const start = lanes[gap].y + lanes[gap].h
        list.sort((a, b) => a.x1 - b.x1).forEach((e, k) => (e.gy = start + (LANE_GAP * (k + 1)) / (list.length + 1)))
    }

    const labelAt = (x: number, y: number, label: string | undefined, anchor: "c" | "start") => {
        if (!label) return ""
        const w = label.length * 6.2 + 10
        const rx = anchor === "c" ? x - w / 2 : x - 4
        return `<rect class="lbg" x="${rx}" y="${y - 11}" width="${w}" height="15" rx="4"/><text class="xs${anchor === "c" ? " c" : ""}" x="${x}" y="${y}">${esc(label)}</text>`
    }
    let paths = ""
    let labels = ""
    for (const e of edges) {
        const cls = e.dashed ? "ard" : "ar"
        if (e.kind === "side") {
            const right = e.from.x < e.to.x
            const x1 = right ? e.from.x + e.from.w : e.from.x
            const x2 = right ? e.to.x - 2 : e.to.x + e.to.w + 2
            const y = e.from.y + e.from.h / 2
            paths += `<path class="${cls}" d="M${x1} ${y} H${x2}"/>`
            labels += labelAt((x1 + x2) / 2, Math.min(e.from.y, e.to.y) - 5, e.label, "c")
        } else if (e.kind === "over") {
            const gy = e.from.y - 12
            paths += `<path class="${cls}" d="M${e.x1} ${e.from.y} V${gy} H${e.x2} V${e.to.y - 2}"/>`
            labels += labelAt((e.x1 + e.x2) / 2, gy - 4, e.label, "c")
        } else {
            const down = e.from.lane < e.to.lane
            const y1 = down ? e.from.y + e.from.h : e.from.y
            const y2 = down ? e.to.y - 2 : e.to.y + e.to.h + 2
            const straight = Math.abs(e.x1 - e.x2) < 1
            paths += `<path class="${cls}" d="${straight ? `M${e.x1} ${y1} V${y2}` : `M${e.x1} ${y1} V${e.gy} H${e.x2} V${y2}`}"/>`
            labels += straight ? labelAt(e.x1 + 8, (y1 + y2) / 2 + 4, e.label, "start") : labelAt((e.x1 + e.x2) / 2, e.gy + 4, e.label, "c")
        }
    }
    const laneSvg = lanes.map(l => `<rect class="lane" x="8" y="${l.y}" width="${W - 16}" height="${l.h}" rx="14"/>`).join("")
    const laneTitles = lanes
        .map(l => {
            const lines = wrap(l.name.toUpperCase(), 15, 3, `diagram lane ${l.name}`)
            const y0 = l.y + l.h / 2 - ((lines.length - 1) * 15) / 2 + 4
            return lines.map((line, k) => `<text class="lt" x="24" y="${y0 + k * 15}">${esc(line)}</text>`).join("")
        })
        .join("")
    const nodeSvg = [...boxes.values()]
        .map(b => {
            const cls = retire.has(b.id) ? "old" : highlight.has(b.id) ? "acc" : "b"
            let ty = b.y + (b.h - (b.label.length * 17 + b.sub.length * 15)) / 2 + 13
            let out = `<rect class="${cls}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="9"/>`
            for (const line of b.label) {
                out += `<text class="t c" x="${b.x + b.w / 2}" y="${ty}">${esc(line)}</text>`
                ty += 17
            }
            for (const line of b.sub) {
                out += `<text class="s c" x="${b.x + b.w / 2}" y="${ty}">${esc(line)}</text>`
                ty += 15
            }
            return out
        })
        .join("")
    for (const id of [...highlight, ...retire]) if (!boxes.has(id)) warn(`diagram: highlight/retire refers to unknown node ${id}`)
    return figure(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Architecture diagram">${laneSvg}${paths}${nodeSvg}${laneTitles}${labels}</svg>`, undefined, v.caption)
}

const timeline = (v: Visual) => {
    const phases: any[] = v.phases ?? []
    const unit = v.unit === "month" ? "M" : "W"
    const W = 640, L = 170, R = 12, T = 30, ROW = 72
    const max = Math.max(1, ...phases.map(p => Number(p.end)))
    const sx = (W - L - R) / max
    const step = max <= 12 ? 1 : max <= 26 ? 2 : 4
    const H = T + phases.length * ROW
    let svg = `<line class="axis" x1="${L}" x2="${W - R}" y1="${T - 4}" y2="${T - 4}"/>`
    for (let u = 1; u <= max; u += step)
        svg += `<line class="axis" x1="${L + (u - 1) * sx}" x2="${L + (u - 1) * sx}" y1="${T - 8}" y2="${T - 4}"/><text class="xs c" x="${L + (u - 0.5) * sx}" y="${T - 14}">${unit}${u}</text>`
    phases.forEach((p, i) => {
        const y = T + 10 + i * ROW
        const start = Number(p.start), end = Number(p.end)
        const bx = L + (start - 1) * sx, bw = (end - start + 1) * sx
        if (i) svg += `<line class="grid" x1="0" x2="${W}" y1="${y - 10}" y2="${y - 10}"/>`
        wrap(String(p.name ?? ""), 20, 2, `timeline phase ${p.name}`).forEach((line, k) => (svg += `<text class="t" x="4" y="${y + 16 + k * 17}">${esc(line)}</text>`))
        svg += `<rect class="acc" x="${bx}" y="${y}" width="${bw}" height="24" rx="6"/>`
        if (bw > 56) svg += `<text class="m c" x="${bx + bw / 2}" y="${y + 16}">${unit}${start}–${end}</text>`
        if (p.outcome) svg += `<text class="s" x="${L}" y="${y + 44}">${esc(wrap(String(p.outcome), Math.floor((W - L - R) / 6.6), 1, `timeline phase ${p.name}`)[0])}</text>`
    })
    return figure(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline">${svg}</svg>`)
}

const visual = (v: Visual) => {
    switch (v.type) {
        case "pillars":
            return pillars(v)
        case "metrics":
            return metrics(v)
        case "chart":
            return chart(v)
        case "diagram":
            return diagram(v)
        case "timeline":
            return timeline(v)
        default:
            warn(`unknown visual type: ${v.type}`)
            return ""
    }
}

// ---------- slides ----------
// Output is Deck HTML v1: no scripts, presenter-only content marked data-private; the host runtime provides navigation.

const notes = (s: string) =>
    s
        ? `<aside class="notes" data-toggle-target="notes" data-private>${blocks(s)}</aside><button class="notes-btn" data-toggle="notes" data-private>Notes</button>`
        : ""
const header = (kicker: string, title: string) => `<div class="top"><div class="kicker">${inline(kicker)}</div></div><h2>${inline(title)}</h2>`

const answerBody = (md: string) => {
    const items = listItems(md)
    if (!items.length) return blocks(md)
    return `<div class="ans">${items
        .map(item => {
            const m = item.match(/^\**([^:*]{1,30})(?::\**|\**:)\s+(.*)$/)
            const [label, rest] = m ? [m[1], m[2]] : ["", item]
            return `<div class="ans-row${/recommend/i.test(label) ? " rec" : ""}"><span>${esc(label)}</span><p>${inline(rest)}</p></div>`
        })
        .join("")}</div>`
}

const slideHtml = (s: Slide) => {
    const visuals = s.visuals.map(visual).join("")
    let content: string
    if (s.id === "answer") content = `<div class="answer">${answerBody(s.body)}${visuals}</div>`
    else if (FULL_WIDTH.has(s.id) || !visuals) content = `<div class="full">${blocks(s.body)}${visuals}</div>`
    else content = `<div class="cols"><div class="left">${blocks(s.body)}</div><div class="right">${visuals}</div></div>`
    return `<section class="slide" id="${esc(s.id)}" data-title="${esc(s.title)}">${header(s.kicker, s.title)}${content}${notes(s.notes)}</section>`
}

const date = meta.date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
const cover = `<section class="slide" id="cover" data-title="${esc(meta.deck_title)}"><div class="cover"><div>
<div class="kicker">${inline(meta.client)}</div><h1>${inline(meta.deck_title)}</h1><div class="cover-rule"></div>
<div class="cover-meta">${esc(date)}</div></div></div></section>`

const assumptionItems = listItems(section("assumptions"))
const assumptions = `<section class="slide" id="assumptions" data-title="Assumptions and open questions">${header("Appendix", "Assumptions and open questions")}
<div class="grid2"><div class="panel"><h3>Assumptions</h3>${blocks(
    assumptionItems.filter(i => !/^O\d/.test(i)).map(i => `- ${i}`).join("\n")
)}</div><div class="panel"><h3>Open questions</h3>${blocks(assumptionItems.filter(i => /^O\d/.test(i)).map(i => `- ${i}`).join("\n"))}</div></div></section>`

const qaSlide = `<section class="slide dense" id="qa" data-title="Q&amp;A prep" data-private>${header("Presenter only", "Q&A prep")}
<div class="full">${table(["| Likely challenge | Answer |", "|---|---|", ...qa.map(x => `| ${x.q.replace(/\|/g, "/")} | ${x.a.replace(/\|/g, "/")} |`)])}</div></section>`

const coverageSlide = `<section class="slide dense" id="coverage" data-title="Ask coverage" data-private>${header("Presenter only", "Every ask, and where it is answered")}
<div class="full"><p class="para"><b>Governing thought:</b> ${inline(meta.governing_thought)}</p>${table([
    "| Ask | Question | Slides |",
    "|---|---|---|",
    ...asks.map(q => `| ${q.id} | ${q.text.replace(/\|/g, "/")} | ${coverage.get(q.id)?.join(", ") || "**not covered**"} |`)
])}</div></section>`

const deck = [cover, ...slides.map(slideHtml), assumptions, qaSlide, coverageSlide].join("\n")

// ---------- page ----------

const CSS = `
:root{
  --letterbox:#e8e4da; --paper:#fbfaf7; --box:#ffffff; --ink:#18202e; --ink-2:#3b4556; --muted:#667085;
  --line:#e2ddd2; --lane:#f3f0e8; --soft:#f3f0e8;
  --accent:#0f766e; --accent-soft:#dcf1ec; --accent-ink:#0b5a54;
  --danger:#c2410c; --danger-soft:#fde8dc; --ui:#4f46e5; --ui-soft:#e8e7fb; --frozen:#2563eb;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
}
.top{display:flex;justify-content:space-between;align-items:center}
.kicker{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
h1{font-size:72px;line-height:1;letter-spacing:-.03em;margin:0;font-weight:800}
h2{font-size:32px;line-height:1.15;letter-spacing:-.015em;margin:6px 0 22px;font-weight:700;max-width:1100px}
h3{font-size:17px;margin:0 0 8px;font-weight:700}
code{font-family:var(--mono);font-size:.9em;background:var(--soft);border-radius:4px;padding:0 4px}
.src{display:inline-block;font-family:var(--mono);font-size:10.5px;font-weight:600;color:var(--muted);background:var(--soft);border-radius:4px;padding:0 5px;vertical-align:1px;white-space:nowrap}
.para{font-size:16px;line-height:1.55;color:var(--ink-2);margin:0 0 12px}
.pts{margin:0;padding-left:18px;font-size:16px;line-height:1.55;color:var(--ink-2)}
.pts li{margin-bottom:9px}
.pts b{color:var(--ink)}
.cols{display:grid;grid-template-columns:400px 1fr;gap:32px;flex:1;min-height:0}
.left{min-height:0;overflow:hidden;display:flex;flex-direction:column}
.callout{margin-top:auto;background:var(--accent-soft);border-left:4px solid var(--accent);border-radius:10px;padding:14px 18px;font-size:17px;line-height:1.45;font-weight:600;color:var(--accent-ink)}
.right{display:flex;flex-direction:column;gap:14px;min-height:0}
.full{flex:1;min-height:0;display:flex;flex-direction:column;gap:16px}
.full table.comp{font-size:17px}
.full table.comp td{padding:15px 12px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;min-height:0}
.panel{background:var(--box);border:1px solid var(--line);border-radius:14px;padding:18px 20px;min-height:0;overflow:hidden}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.metric{background:var(--soft);border-radius:10px;padding:12px 16px}
.metric b{display:block;font-size:28px;letter-spacing:-.02em;line-height:1.15}
.metric span{font-size:13px;color:var(--muted);line-height:1.35;display:block}
.metric.wide{grid-column:span 2}
figure.dg{margin:0;flex:0 1 auto;min-height:0;background:var(--box);border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
figure.dg svg{width:100%;height:auto;min-height:0;max-height:100%}
.ft{font-size:13px;font-weight:700;color:var(--ink-2)}
figcaption{font-size:13.5px;font-weight:600;color:var(--accent-ink);line-height:1.4}
table.comp{width:100%;border-collapse:collapse;font-size:15px}
table.comp th{text-align:left;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:8px 10px;border-bottom:2px solid var(--line)}
table.comp td{padding:11px 10px;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.45;color:var(--ink-2)}
table.comp td:first-child{font-weight:700;color:var(--ink);width:22%}
.ans{display:flex;flex-direction:column;gap:22px}
.ans-row{display:grid;grid-template-columns:170px 1fr;gap:20px;align-items:baseline}
.ans-row span{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.ans-row p{margin:0;font-size:21px;line-height:1.45;color:var(--ink-2)}
.ans-row.rec{border-left:4px solid var(--accent);padding:4px 0 4px 16px;margin-left:-20px}
.ans-row.rec span{color:var(--accent)}
.ans-row.rec p{font-size:30px;font-weight:600;line-height:1.35;color:var(--ink);letter-spacing:-.01em}
.answer{flex:1;display:flex;flex-direction:column;justify-content:center;gap:56px;padding-bottom:24px}
.pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.pillar{background:var(--box);border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:12px;padding:22px 24px}
.pillar i{font-style:normal;font-family:var(--mono);font-size:12px;font-weight:600;color:var(--accent)}
.pillar h3{margin:8px 0 8px;font-size:20px;line-height:1.3}
.pillar p{margin:0;font-size:16px;line-height:1.5;color:var(--ink-2)}
.cover{flex:1;display:flex;align-items:center}
.cover .kicker{margin-bottom:22px}
.cover-rule{width:72px;height:4px;border-radius:2px;background:var(--accent);margin:34px 0 22px}
.cover-meta{font-family:var(--mono);font-size:13px;letter-spacing:.04em;color:var(--muted)}
.dense .full{overflow:auto}
.dense table.comp{font-size:13px}
.dense table.comp td{padding:7px 10px}
.slide,.slide *{box-sizing:border-box}
.notes{display:none;position:absolute;left:24px;right:24px;bottom:52px;max-height:46%;overflow:auto;background:#141a24;color:#e5e7eb;border-radius:12px;padding:14px 18px;z-index:5;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.notes.open{display:block}
.notes-btn{position:absolute;right:20px;bottom:14px;font:600 11px var(--mono);color:var(--muted);background:var(--box);border:1px dashed var(--line);border-radius:999px;padding:3px 10px;cursor:pointer}
.notes-btn[aria-expanded="true"]{color:var(--accent);border-color:var(--accent)}
.notes .pts,.notes .para{color:#e5e7eb;font-size:15px}
.notes b{color:#fff}
svg text{font-family:var(--sans);fill:var(--ink)}
svg .t{font-size:14px;font-weight:600}
svg .s{font-size:12px;fill:var(--muted)}
svg .xs{font-size:11px;fill:var(--muted)}
svg .m{font-family:var(--mono);font-size:11px;fill:var(--accent-ink);font-weight:600}
svg .c{text-anchor:middle}
svg .e{text-anchor:end}
svg .lt{font-size:11px;font-weight:700;letter-spacing:.1em;fill:var(--muted)}
svg .lane{fill:var(--lane)}
svg .lbg{fill:var(--paper);opacity:.95}
svg .grid{stroke:var(--line);stroke-width:1}
svg .axis{stroke:var(--muted);stroke-width:1}
svg .b{fill:var(--box);stroke:var(--ink-2);stroke-width:1.2}
svg .acc{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
svg .old{fill:var(--box);stroke:var(--danger);stroke-width:1.3;stroke-dasharray:5 4}
svg .ar{fill:none;stroke:var(--ink-2);stroke-width:1.4;marker-end:url(#ah)}
svg .ard{fill:none;stroke:var(--ink-2);stroke-width:1.3;stroke-dasharray:5 4;marker-end:url(#ah)}
svg .sl{fill:none;stroke-width:2.5}
`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="deck:spec" content="1">
<meta name="deck:subtitle" content="${esc(meta.client)}">
<title>${esc(meta.deck_title)} · ${esc(meta.client)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">
<style>${CSS}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#3b4556"/></marker></defs></svg>
${deck}
</body>
</html>
`

writeFileSync(outPath, html)
console.log(`rendered ${slides.length + 4} slides → ${outPath}`)
if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`)
    for (const w of warnings) console.log(`  - ${w}`)
}
