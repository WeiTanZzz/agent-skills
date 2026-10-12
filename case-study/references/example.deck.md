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
        sub: GitHub Actions · SAST · evidence
      - id: tf
        label: Terraform modules
        sub: TFC private registry · semver
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
notes: Backstage: an open-source developer portal with a service catalogue and templates. S3 object lock: write-once storage; nothing can change or delete an object until its retention ends. Walk it top to bottom, following one merge. Point at the evidence store when you mention the audit finding from slide 3.

## flow
title: One merge reaches production with evidence and no stored keys
kicker: Request flow · merge to production
answers: [Q2, Q4]
body:
- Every step runs inside the platform-owned workflow; the team's repo only pins `golden-path@v2`.
> Security gets evidence on every change; teams get a release with no ticket and no stored keys.
visual:
```yaml
type: sequence
participants:
  - id: dev
    label: Developer
  - id: gh
    label: GitHub
    sub: branch protection
  - id: wf
    label: Reusable workflow
    sub: golden-path@v2
  - id: sts
    label: AWS STS
    sub: OIDC trust
  - id: ev
    label: Evidence store
    sub: S3 object lock
  - id: prod
    label: Production
    sub: PCI account
highlight: [wf, ev]
steps:
  - from: dev
    to: gh
    label: merge to main
  - from: gh
    to: wf
    label: trigger
  - from: wf
    to: wf
    label: build · test · SAST · SBOM
  - from: wf
    to: sts
    label: OIDC token for this repo
  - from: sts
    to: wf
    label: 1-hour deploy role
    dashed: true
  - from: wf
    to: ev
    label: approver, diff, scan results
  - from: wf
    to: prod
    label: terraform apply · deploy
  - from: wf
    to: gh
    label: status + evidence link
    dashed: true
caption: Controls fire at steps 1, 3, 4 and 6; none depends on a person remembering.
```
notes: OIDC federation: GitHub signs a short-lived token saying which repo and branch is running; AWS STS swaps it for temporary role credentials. SBOM: a list of every dependency in the build. Walk the numbers. Step 4 is the one engineers ask about — the role trusts only this repo and the main branch, so a fork cannot deploy. Step 6 writes evidence before deploy, so a failed write blocks the release.

## security
title: Every PCI control is enforced by the path, not by review
kicker: Security model
answers: [Q4]
body:
| Concern | Control | Implemented with | Evidence |
|---|---|---|---|
| Long-lived cloud keys | Short-lived, repo-scoped deploy roles | GitHub OIDC → IAM role, `sub` pinned to repo and branch | CloudTrail `AssumeRoleWithWebIdentity` |
| Unreviewed change to prod | Two approvals before merge | Branch protection + CODEOWNERS | PR record in evidence store |
| Vulnerable code or dependencies | Block on high findings | SAST and SCA steps in the workflow | Scan report per release |
| Tampered evidence | Write-once storage | S3 object lock, compliance mode, 7 years | Bucket policy, lock config |
| Teams bypassing the path | Only the path can deploy | SCP denies deploy roles not created by the platform | SCP in org config |
> Compliance becomes a property of the path, so the audit samples the path, not 220 pipelines.
visual: none
notes: If the security architect pushes, the SCP row is the backstop — even a team that forks the workflow cannot assume a deploy role.

## tradeoffs
title: We trade pipeline freedom for speed and audit safety
kicker: Trade-offs
answers: [Q2]
body:
| Decision | Chosen | Rejected | Why | Cost |
|---|---|---|---|---|
| Security gate vs daily shipping | Controls inside the reusable workflow | Manual change review | Every change checked, no human queue | Teams cannot customise the pipeline |
| Central platform vs team autonomy | Semver, two supported majors | Single latest version | Teams upgrade on their own schedule | Platform maintains two versions |
| Keep Jenkins or replace | GitHub Actions, retire Jenkins in waves | Standardise one Jenkins estate | Native OIDC and evidence; one upgrade path | Both run side by side ~6 months |
| Runners | GitHub-hosted, self-hosted only for PCI | All self-hosted | Less to operate for a team of five | PCI runners still need patching |
> We say up front what we give up, and what would make us change it.
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
| Area | Mechanism | Why |
|---|---|---|
| Security | Signed artifacts (Sigstore); deploy only signed images | Closes the supply-chain gap left after the PoC |
| Resilience | PCI runners as an ASG across two AZs; workflows pinned by tag | A runner outage must not stop 35 teams |
| Observability | Workflow events → DORA metrics per team in CloudWatch | Proves the outcome, not just adoption |
| Governance | Semver, changelog, two supported majors, Renovate upgrade PRs | Upgrades without breaking teams |
| Operability | Platform on call for the path only; runbooks per failure mode | Fits a team of five |
> The platform team supports one path, not 220 pipelines.
visual: none
notes: Two minutes. If pressed on cost, runners are the only new spend; everything else reuses what they already license.

## delivery
title: Three waves move all 35 teams in nine months
kicker: Roadmap
answers: [Q5]
body:
- **Team:** 2 platform engineers, 1 lead, security weekly.
- **We need:** auditor time in week 6; a named pilot team.
- **Top risk:** teams resist moving → volunteers first.
- **Rests on:** auditor accepts automated evidence (A1); two engineers ring-fenced (A3).
> Two decisions this week: the pilot team and the auditor slot.
visual:
```yaml
type: timeline
unit: month
phases:
  - name: PoC
    start: 1
    end: 2
    outcome: Pilot team live on the path · owner platform lead
  - name: Wave 1 · volunteers
    start: 3
    end: 4
    outcome: 10 teams; Jenkins frozen · owner platform lead
  - name: Wave 2 · high-change teams
    start: 5
    end: 7
    outcome: 25 teams; DORA report monthly · owner eng managers
  - name: Wave 3 · the rest
    start: 7
    end: 9
    outcome: Jenkins switched off · owner Head of Platform
```
notes: Close on the two decisions, then stop and invite questions.

# Q&A prep
- Q: [Tech] What stops a fork or a feature branch from deploying to production?
  A: The deploy role's trust policy pins the OIDC `sub` to the repo and `refs/heads/main`, and an SCP denies any other deploy role. A fork gets no token that the role accepts.
- Q: [Tech] What happens to 35 teams when you ship a breaking change to the workflow?
  A: Nothing until they move: they pin `@v2`, breaking changes go to `@v3`, and v2 keeps security fixes for six months. If two majors prove too heavy, one major plus Renovate upgrade PRs.
- Q: [Tech] The evidence write fails mid-release. Then what?
  A: The deploy step depends on it, so the release stops and the team retries. Blocking a release is cheaper than an unevidenced change in PCI scope.
- Q: [Tech] How do you stop teams forking the workflow?
  A: Forks lose evidence capture and cannot assume the deploy role. We would rather make the paved road better than police forks.
- Q: [Tech] Why GitHub-hosted runners in a PCI estate?
  A: Only non-PCI builds use them; PCI deploys run on self-hosted runners inside the PCI account. If the QSA objects, everything moves self-hosted at the cost of patching.
- Q: [Biz] Why not standardise Jenkins instead of replacing it?
  A: Fair, it is cheaper short term. But four estates means four upgrade paths, and evidence capture is native in workflows. If the auditor accepted Jenkins evidence as-is, I would reconsider.
- Q: [Biz] Two supported majors doubles the platform's work. Can five people do it?
  A: It adds load, but bounded to the path, and it is what stops upgrades breaking teams. If adoption lags, we drop to one major plus an automated upgrade PR.
- Q: [Biz] What if the auditor rejects automated evidence in week 6?
  A: That is why it is the go/no-go. We would add a lightweight human sign-off step to the workflow and re-test, rather than scale an unproven path.
- Q: [Biz] Why Backstage? It is heavy to run.
  A: They already run it for 60% of teams [§3]; we only add a template. If it were not there, a CLI scaffold would do for the PoC.
- Q: [Biz] Nine months feels slow.
  A: The constraint is team migration capacity, not the platform. Wave 1 volunteers will tell us if waves 2 and 3 can be compressed. (your story)

# Assumptions and open questions
- A1: The auditor accepts machine-generated change evidence — if wrong: add a human sign-off step to the workflow — validate: auditor review in week 6.
- A2: GitHub Actions is licensed for all teams — if wrong: licence cost enters the business case — validate: procurement, week 1.
- A3: Two platform engineers can be ring-fenced for 9 months — if wrong: waves 2 and 3 slip by a quarter — validate: Head of Platform, before kick-off.
- O1: Which team volunteers as the pilot? — owner: Head of Engineering
- O2: Is multi-region in scope for year one? — owner: CTO
