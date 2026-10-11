---
client: Harbourline Retail
deck_title: Paved roads to production
governing_thought: Replace four bespoke Jenkins estates with one versioned golden path, so teams ship daily and PCI controls run on every change by default.
date: 12 October 2026
---

# Asks
- Q1: Where are we today, and what is slowing delivery down?
- Q2: What should our target CI/CD platform look like?
- Q3: What would you prove in an 8-week proof of concept?
- Q4: What does it take to run this in production for 35 teams?
- Q5: How should we roll it out, and what do you need from us?

# Slides

## answer
title: One versioned golden path gets 35 teams shipping daily, safely
kicker: Recommendation
answers: [Q2]
body:
- Problem: Four Jenkins estates and 220 bespoke pipelines make every release slow and every audit painful. [§2]
- Recommendation: Replace them with one versioned golden path, so teams ship daily and PCI controls run on every change by default.
visual:
```yaml
type: pillars
items:
  - head: Golden path, not gatekeeping
    text: Reusable workflows carry the PCI controls; teams inherit them instead of queueing for review.
  - head: Versioned like a product
    text: Semantic versions and two supported majors let teams upgrade on their own schedule.
  - head: Retire Jenkins in waves
    text: Volunteers first, a freeze on new Jenkins pipelines, no big-bang cutover.
```
notes: Open with the answer, not the background. One sentence of problem, the recommendation, then the three pillars left to right. About 2 minutes.

## context
title: Delivery slows as teams grow, because every team rebuilt the pipeline
kicker: What we found
answers: [Q1]
body:
- **220 pipelines** across 4 Jenkins estates; no two alike. [Ex A]
- **31% of releases** lacked PCI change evidence at audit. [Ex C]
- Platform team of 5 spends **70%** of its time on pipeline tickets. [Email: Head of Platform]
> Teams grew 25% this year; releases fell 27%. The queue, not the code, is the bottleneck.
visual:
```yaml
type: metrics
items:
  - value: 9 days
    label: Median lead time, commit to production
    source: Ex B
  - value: 18%
    label: Change failure rate
    source: Ex B
```
```yaml
type: chart
kind: bar
title: Releases per month, all teams
x: [Apr, May, Jun, Jul, Aug, Sep]
series:
  - name: Releases
    values: [96, 88, 91, 79, 74, 70]
source: Ex B
note: Six months of decline while headcount rose.
```
notes: Three findings, then land the callout — it is the commercial point. If asked, the 25% is 28 → 35 teams [Ex A].

## solution
title: Teams self-serve one golden path; the platform owns its versions
kicker: Target platform
answers: [Q2]
body:
- **Backstage** scaffolds a repo already wired to the path.
- **Reusable workflows** build, test, scan and capture PCI evidence on every merge.
- **Terraform modules** deploy through a private registry, semantically versioned.
> Controls live in the path, so compliance is the default rather than a gate.
visual:
```yaml
type: diagram
lanes:
  - name: Product teams
    nodes:
      - id: portal
        label: Backstage portal
        sub: self-service templates
      - id: repo
        label: Service repo
        sub: created from template
  - name: Golden path (platform-owned)
    nodes:
      - id: wf
        label: Reusable workflows
        sub: build · test · SAST · evidence
      - id: tf
        label: Terraform modules
        sub: private registry · semver
      - id: jenkins
        label: Jenkins estates
        sub: retired in waves
  - name: AWS accounts
    nodes:
      - id: audit
        label: Evidence store
        sub: S3 object lock
      - id: stg
        label: Staging
      - id: prod
        label: Production
        sub: PCI scope
edges:
  - from: portal
    to: repo
    label: scaffolds
  - from: repo
    to: wf
    label: every merge
  - from: wf
    to: tf
    label: plan · apply
  - from: wf
    to: audit
    label: change evidence
  - from: tf
    to: stg
  - from: tf
    to: prod
highlight: [wf, tf]
retire: [jenkins]
caption: Green is what we build; dashed red is what we retire.
```
notes: Walk it top to bottom, following one merge. Point at the evidence store when you mention the audit finding from slide 3.

## tensions
title: Each tension is resolved by a mechanism, not a compromise
kicker: Trade-offs
answers: [Q2]
body:
| Tension | Mechanism | Why it works | What we trade off |
|---|---|---|---|
| Security wants a gate; product wants to ship daily | Controls run inside the reusable workflow | Every change is checked, with no human queue | Teams lose freedom to customise the pipeline |
| Central platform vs team autonomy | Versioned modules, two supported majors | Teams upgrade on their own schedule | Platform carries two versions at once |
| Build new vs keep Jenkins | Retire Jenkins in waves behind the template | No big-bang cutover, no stalled teams | Both run side by side for ~6 months |
> We trade pipeline freedom for speed and audit safety, and say so up front.
visual: none
notes: Expect the challenge here. Defend the two-major window and offer the fallback from the Q&A prep.

## poc
title: The PoC proves one team can ship daily with evidence captured
kicker: Proof of concept · 8 weeks
answers: [Q3]
body:
- **In:** Backstage template, two workflows, one Terraform module, one pilot team.
- **Out:** other teams, multi-region, Jenkins changes.
- **Success:** lead time under 1 day; 100% of changes with evidence; the pilot team keeps it.
> Week 6 is the go/no-go: the auditor accepts automated evidence, or we stop.
visual:
```yaml
type: timeline
unit: week
phases:
  - name: Template and workflows
    start: 1
    end: 3
    outcome: Repo to staging in one click
  - name: Evidence and production
    start: 4
    end: 6
    outcome: First production release with automatic PCI evidence
  - name: Pilot running
    start: 6
    end: 8
    outcome: Pilot ships daily for two weeks; measure and decide
```
notes: The riskiest assumption is the auditor, not the tech. That is why evidence comes before scale.

## production
title: Production readiness means running the path like a product
kicker: Path to production
answers: [Q4]
body:
| Area | What we add | Why |
|---|---|---|
| Security | OIDC to AWS, no long-lived keys; signed artifacts | Closes the credential findings from the audit |
| Resilience | Runners across two AZs; pinned workflow versions | A runner outage must not stop 35 teams |
| Observability | DORA metrics per team from workflow events | Proves the outcome, not just adoption |
| Governance | Semver, changelog, two supported majors | Upgrades without breaking teams |
| Operability | Platform on call for the path, not team services | Fits a team of five |
> The platform team supports one path, not 220 pipelines.
visual: none
notes: Two minutes. If pressed on cost, runners are the only new spend; everything else reuses what they already license.

## delivery
title: Three waves move all 35 teams in nine months
kicker: Roadmap
answers: [Q5]
body:
- **Team:** 2 platform engineers, 1 consultant lead, security one day a week.
- **We need:** auditor time in week 6; a named pilot team.
- **Top risk:** teams resist moving → volunteers first; freeze new Jenkins pipelines.
> Two decisions this week: the pilot team and the auditor slot.
visual:
```yaml
type: timeline
unit: month
phases:
  - name: PoC
    start: 1
    end: 2
    outcome: One team on the golden path
  - name: Wave 1 · volunteers
    start: 3
    end: 4
    outcome: 10 teams; Jenkins frozen for new pipelines
  - name: Wave 2 · high-change teams
    start: 5
    end: 7
    outcome: 25 teams migrated
  - name: Wave 3 · the rest
    start: 7
    end: 9
    outcome: Jenkins switched off
```
notes: Close on the two decisions, then stop and invite questions.

# Q&A prep
- Q: Why not standardise Jenkins instead of replacing it?
  A: Fair, it is cheaper short term. But four estates means four upgrade paths, and evidence capture is native in workflows. If the auditor accepted Jenkins evidence as-is, I would reconsider.
- Q: Two supported majors doubles the platform's work. Can five people do it?
  A: It adds load, but bounded to the path, and it is what stops upgrades breaking teams. If adoption lags, we drop to one major plus an automated upgrade PR.
- Q: How do you stop teams forking the workflow?
  A: Forks lose evidence capture, so they fail the change check. We would rather make the paved road better than police forks.
- Q: What if the auditor rejects automated evidence in week 6?
  A: That is why it is the go/no-go. We would add a lightweight human sign-off step to the workflow and re-test, rather than scale an unproven path.
- Q: Why Backstage? It is heavy to run.
  A: They already run it for 60% of teams [§3]; we only add a template. If it were not there, a CLI scaffold would do for the PoC.
- Q: Nine months feels slow.
  A: The constraint is team migration capacity, not the platform. Wave 1 volunteers will tell us if waves 2 and 3 can be compressed.

# Assumptions and open questions
- A1: The auditor accepts machine-generated change evidence — validate in week 6.
- A2: GitHub Actions is licensed for all teams — confirm with procurement.
- A3: Two platform engineers can be ring-fenced for 9 months — confirm with Head of Platform.
- O1: Which team volunteers as the pilot? — owner: Head of Engineering
- O2: Is multi-region in scope for year one? — owner: CTO
