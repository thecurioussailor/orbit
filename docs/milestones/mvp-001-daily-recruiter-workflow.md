# MVP-001: Daily Recruiter Workflow

> Version: 0.2  
> Status: Accepted  
> Last Updated: July 2026  
> Architecture Baseline: v0.2 (Frozen)

---

## Purpose

This document defines the first production capability of Orbit.

Orbit is an AI Operating Companion designed to help users accomplish goals rather than manually operate software.

The purpose of MVP-001 is **not** to build an email assistant.

Its purpose is to validate Orbit's architecture by solving a real daily workflow that the founder personally performs every morning.

This MVP intentionally focuses on recruiter email triage because it provides immediate daily value while exercising the core architectural concepts of Orbit:

- Goal-based interaction
- Planning
- Workflow generation
- Task execution
- Safety and approvals
- Executor abstraction
- World State observation

Success means validating both the product and the architecture through daily real-world usage.

---

# Problem Statement

An active job search generates a daily stream of recruiter email: outreach,
follow-ups, scheduling threads, and offers buried between newsletters and
noise. Triaging it costs 30–60 minutes every morning, the stakes of a missed
or badly-written reply are high, and the work is almost entirely
mechanical: identify, read, contextualize, draft, send.

Today's tools each solve a fragment — filters identify, templates draft,
nothing coordinates. The user still performs the workflow manually every
day. That coordination gap is exactly the layer Orbit exists to occupy.

---

# Product Goal

Ship the first version of Orbit that its founder genuinely uses every
morning without being reminded.

This MVP exists to validate two things simultaneously:

1. **Product:** an intent-driven workflow ("handle my recruiter emails")
   is meaningfully better than manual triage.
2. **Architecture:** the frozen v0.2 design — pipeline, registry,
   compiler, safety gate, feedback loop — survives contact with a real
   daily workflow, real APIs, and a real user's patience.

Orbit v0.1 is deliberately narrow. It is not an email assistant as a
product category; it is an AI Operating Companion whose *first learned
skill* is email triage. The architecture (executor-agnostic capabilities,
plan/execute separation) is what keeps those two things different.

---

# User Story

> Every morning, I open Orbit and say "triage my recruiter emails."
> Orbit shows me its plan; I approve it once. A few minutes later I get a
> single review screen: each recruiter thread summarized in two lines,
> flagged by urgency, with a drafted reply waiting under each one — and
> where a company was mentioned, a one-line snapshot of who they are.
> I skim, edit a draft or two, and approve sends one by one.
> Orbit sends exactly what I approved and nothing else — ever.
> Ten minutes, done, and every reply sounds like me because Orbit knows
> my situation and tone from its preferences file.

---

# User Flow

1. **Open Orbit** (desktop app or local web UI — minimal chat surface).
2. **Express intent:** "triage my recruiter emails."
   - If the goal is ambiguous ("handle my email"), the Goal Builder asks
     one clarifying question before anything reaches the Planner.
3. **Review the Workflow** (plain-language steps with risk hints):
   find recruiter threads → summarize each → flag urgency → draft replies
   → research mentioned companies (read-only) → present for review.
   The draft step is marked *mutating*; no step is irreversible.
4. **Approve the Workflow** (one tap; later, policy can auto-approve this
   recurring shape).
5. **Orbit executes.** Progress is visible per task. Company research runs
   in parallel with drafting and is non-blocking: if it fails, the digest
   ships without it.
6. **Review screen.** One screen, ordered by urgency: summary, urgency
   flag, company snapshot (when available), draft reply. Per thread:
   **Send** (explicit confirmation — the irreversible gate), **Edit then
   send**, **Skip**. Full threads open in Gmail via deep link — Orbit does
   not rebuild an email client.
7. **Completion report:** what was read, drafted, sent, skipped — each
   item traceable to the approved Workflow step.

---

# Scope

## Included

- **Goal:** the single goal class "triage recruiter emails" (template
  strategy in the Planner; LLM-generalized planning is post-MVP).
- **Gmail via API executor:** search threads, read threads, create drafts,
  send message. API over browser automation per the reliability
  constraint; the capability layer keeps the Planner ignorant of the
  choice.
- **Model executor:** `text.classify_recruiter`, `text.summarize_thread`,
  `text.draft_reply` as registered capabilities. Executors still don't
  *decide* — a generation capability has a contract (params in, artifact
  out) like any other; judgment about *when* to invoke it belongs to the
  plan.
- **Browser executor (read-only, stretch):** `browser.open_url` +
  `browser.extract_content` for company lookup. Parallel, non-critical,
  droppable (see Milestones).
- **Safety:** hardcoded rule — mutating → batch approval at workflow
  level; irreversible (`email.send`) → per-action explicit confirmation.
- **Memory (read-only):** static preferences file — tone, signature,
  job-search context ("frontend, prefers early-stage, based in Delhi,
  remote-friendly"), notes on what "urgent" means.
- **Effect verification:** post-task predicate checks
  (`draft_exists(threadId)`, `message_sent(threadId)`); action-level
  retry; task-level failure with an explainable report.
- **Review interface:** one screen, as described. No thread browsing, no
  inbox view, no settings UI (preferences are a file).

## Intentionally Excluded

- Desktop observation and desktop executor (v0.2 candidate).
- Sessions, Learning, continuous observation, provider selection.
- Workflow-level replanning (routing rows 3–4): failures past retry stop
  cleanly with a report.
- Any Gmail write beyond drafts and approved sends (no labeling,
  archiving, or deletion — nothing destructive exists in v0.1's
  capability set at all).
- Multi-turn conversation beyond the single clarification path.
- Voice, notifications, scheduling/recurring runs (the user opens Orbit;
  Orbit does not wake itself).
- Non-recruiter email. Classification aims for high precision; false
  negatives are acceptable, false positives erode trust.

---

# Systems Exercised

| System | v0.1 reality |
|---|---|
| Presentation | chat input, workflow approval, review screen, send confirmations |
| Conversation | single-turn pass-through, present as a stage |
| Goal Builder | goal-class validation + one clarification path |
| Planner | template Workflow for the recruiter-triage goal class |
| Compiler | real: exact-match resolution (ADR-0003), policy + effect attachment, diagnostics, fixture-based purity suite |
| Scheduler | dependency-ordered dispatch incl. one parallel branch; task state machine |
| Safety | the two-rule gate; per-send confirmation is the most-exercised path in the product |
| Tool Registry | ~7 manifests across three executors |
| Executors | Gmail (API), Model, Browser — one shared interface |
| World State | snapshot store; MVP predicate set: `thread_matches(query)`, `draft_exists(threadId)`, `message_sent(threadId)`, `url_matches(pattern)`, `page_contains(selector)` |
| Observation | on-demand: snapshot at plan time, targeted verification after each task |
| Memory | static file behind the real Memory interface |
| Replanning | routing rows 1–2 only (action retry → task fail with report) |

---

# Architecture Validation

Assumptions this MVP tests with real code:

1. **Plan/execute separation survives a real product.** Criterion: the
   compiler test suite runs with no network, no Gmail account, no browser
   — fixtures in, byte-identical graph out.
2. **Executor-agnosticism is real.** The Planner emits `email.*` and
   `web.*` capability steps and never learns that Gmail-the-API exists.
   Test: swap the Gmail executor for a mock provider of the same
   capabilities; the Planner and Compiler change zero lines.
3. **Manifest-declared effects power the feedback loop.** Divergence
   (revoke OAuth mid-run; kill the browser task) is detected by failed
   effect predicates, not by executor exceptions leaking upward.
4. **Declarative decomposition is expressive enough** for real
   capabilities — the assumption most likely to strain, watched most
   closely at `browser.extract_content` against real company sites.
5. **The safety gate is livable.** Per-send confirmation must feel like
   control, not nagging, across weeks of daily use. This is the approval-
   fatigue assumption from workflow.md's design review, tested on its
   author.
6. **Parallel, non-critical tasks degrade gracefully** — the research
   branch failing must never block the digest.

---

# Success Criteria

## Product

- P1. The founder runs the triage on **5 consecutive weekdays** without
  external prompting.
- P2. ≥ 50% of drafted replies are sent with light or no edits by week 2.
- P3. Morning triage time measurably drops (self-reported baseline vs.
  week 2).
- P4. Zero trust incidents: no misclassified thread ever gets a draft
  that would embarrass if sent; no send ever surprises the user.

## Architecture

- A1. **The inviolable:** no email is ever sent without an explicit
  per-message approval. Zero exceptions across the MVP's lifetime.
- A2. Compiler purity suite green in CI with no external dependencies.
- A3. Executor-swap test (mock provider) passes with zero Planner/Compiler
  changes.
- A4. Every run — success or failure — is fully explainable from stored
  Workflow + Task Graph + state history alone.
- A5. Both divergence drills (OAuth revocation, browser kill) produce
  correct routing: retry → clean task failure → report; digest unaffected
  by the research branch failing.

---

# Risks

## Product

- **Draft quality is the product.** If replies need heavy rewriting,
  daily use dies regardless of architectural elegance. Mitigation: the
  preferences file carries real voice/context from day one; measure the
  edit rate (P2) as the primary product metric.
- **Classification precision.** A newsletter summarized as a recruiter
  thread erodes trust instantly. Mitigation: precision over recall,
  conservative Gmail query pre-filter before model classification.
- **Approval fatigue.** Per-send confirmation across 8 threads daily may
  grate. We accept the friction in v0.1 and record the pain honestly —
  it directly informs the postponed approvals design.

## Technical

- **Gmail OAuth restricted scopes.** `gmail.send` and read scopes are
  restricted; a published app needs Google verification. v0.1 runs as a
  personal test-mode OAuth app (fine for founder dogfooding, a known wall
  before any external user). De-risked first — it is Milestone 0.
- **Model latency/cost per run.** ~8 threads × (classify + summarize +
  draft) must complete in low minutes at tolerable cost. Measure at M5.
- **Company-site extraction fragility.** Accepted by design: read-only,
  parallel, droppable.

## Architecture

- **Decomposition rigidity** (validation point 4) — the known bet.
- **Exact-match vocabulary coupling:** the template Planner must emit
  registry vocabulary, quietly coupling them. Accepted per ADR-0003's
  MVP scoping; the evidence gathered here prices the semantic-matching
  decision.
- **Effect predicates in API-land** are more verifiable than on-screen
  effects (`draft_exists` via API read is crisp). Risk: this MVP may make
  effect verification look *easier* than the desktop future will be.
  Recorded so v0.2 doesn't inherit false confidence.

---

# Milestones

Each milestone ends demo-able. Dogfooding begins at M7, not at the end.

- **M0 — Access spike (de-risk first).** Test-mode OAuth app; list and
  read recruiter-query threads from the founder's real inbox in a
  throwaway script. No architecture yet — this kills the scariest
  unknown for the cost of an afternoon.
- **M1 — Domain types + Registry.** Goal/Workflow/TaskGraph/Task types;
  manifest loader + validation; the ~7 real manifests authored.
- **M2 — World State v0.1.** Snapshot structure, the 5-predicate
  evaluator.
- **M3 — Compiler.** Exact-match resolution, policy + effect attachment,
  diagnostics, full fixture purity suite. *The planning half of Orbit is
  testable before any executor exists.*
- **M4 — Scheduler + executor interface + Gmail executor.** Task state
  machine, shared executor contract, search/read/create-draft
  capabilities live.
- **M5 — Model executor.** Classify, summarize, draft against real
  threads; measure latency, cost, and draft quality informally.
- **M6 — Safety + review interface.** Two-rule gate, digest screen,
  per-send confirmation, Gmail deep links, `email.send` live.
- **M7 — Goal Builder + Planner + end-to-end.** Template workflow,
  clarification path, happy path complete. **Daily dogfooding starts.**
- **M8 — Verification + failure honesty.** Effect checks, action retry,
  clean task-failure reports; run both divergence drills.
- **M9 (stretch, droppable) — Browser research branch.** Company lookup
  in parallel, graceful degradation. If the schedule slips, v0.1 ships
  without it and no success criterion changes.

---

# Post-MVP

Direction is set by evidence from dogfooding, in this expected order:

1. **Architecture v0.3 revision list** — the real deliverable: where did
   manifests strain, where did we cheat across a seam, what did approval
   fatigue teach. Each finding becomes an ADR or a doc revision; nothing
   else does.
2. **Learning, designed from data:** every edited draft is a labeled
   example of the user's voice. The Learning service gets designed
   against this concrete signal instead of speculation.
3. **Sessions:** "continue where we left off" becomes real once daily
   runs exist to continue from.
4. **Approvals v2:** batch/auto-approval policy, priced by the recorded
   fatigue evidence.
5. **Executor-agnosticism, proven for real:** implement one `email.*`
   capability via the Browser executor and swap providers under an
   unchanged Planner — the architecture's core promise, demonstrated.
6. **Desktop observation** (v0.2's headline): "prepare me for work"
   becomes reachable once the loop is trusted on email.

---

# Co-Founder Review (scope cuts applied)

Three cuts were made to the initial shape, recorded here:

1. **The review UI does not browse email.** Summary + draft + three
   buttons + a deep link to Gmail. Rebuilding a thread viewer is a week
   of UI work that validates nothing.
2. **Company research demoted to stretch (M9).** It differentiates the
   demo but is the only fragile dependency in the slice; the product
   works without it, so it cannot sit on the critical path.
3. **No destructive Gmail capability exists at all in v0.1** — not even
   behind the safety gate. Archive/label/delete would exercise the same
   gate `email.send` already exercises, at pure trust risk.

Judged against "ship quickly, preserve the vision": the slice is now the
smallest thing the founder would use daily that still crosses every major
architectural boundary. Anything smaller stops being a product; anything
larger delays the evidence.
