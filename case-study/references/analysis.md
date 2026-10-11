# Analysis file format

Written in phase 1, updated when the user states decisions. Plain markdown; keep the headings.

````markdown
# <Client> — analysis

## Asks
- Q1: <verbatim>
- Q2: <verbatim>

## Facts
### Goals
- <one line> [source]
### Constraints
- <one line> [source]
### Stakeholders
- <Name, role>: wants <…> / fears <…> / will block <…> [source]
### Assets
- <one line> [source]
### Numbers
- <one line> [source]

## Tensions
- T1: <who> wants <A> / <who> wants <B> — because <root cause>

## Maths
- M1: <formula> = <result> → <implication> [source]

## Decisions to make
### D1: <question>
- **Option A — <name>:** <what it means>
  - Eases: T1 · Worsens: T2
  - Collides with: <constraint / number> [source]
  - Right if: <what you would have to believe>
- **Option B — <name>:** …

## Assumptions and open questions
- A1: <assumption> — validate by <how>
- O1: <question for the client> — owner <who>

# Decisions
<!-- Filled only from what the user states. Empty until then. -->
- Governing thought: <the user's one sentence>
- D1: <chosen option> — <the user's reason>
````

Options are listed in the order they were thought of, never by merit. No option is marked as
preferred, and there is no recommendation anywhere in the file outside `# Decisions`.
