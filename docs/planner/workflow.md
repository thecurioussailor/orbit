# Workflow

> Version: 0.1 · Status: Draft · Last Updated: July 2026
> Subsystem: Planner

## Purpose

A Workflow is Orbit's proposed strategy for achieving a Goal, expressed at a
level of abstraction a human can read, approve, edit, or reject. It is the
artifact that explainability, approval, and auditability attach to. When the
user asks "what are you going to do?" or "why did you do that?", the answer
is always a Workflow — never a Task Graph, never an Action log.

The Workflow is the **source code** of a plan: human-readable, reviewable,
diffable, versioned.

---

## Responsibilities

1. Express strategy as named steps in plain language, free of tool and
   implementation detail ("Find recruiter emails", never "Query Gmail API
   with label filter").
2. Declare, per step, a risk classification hint (informational / mutating /
   irreversible) so the approval surface can highlight what matters.
3. Carry the approval state machine:
   `proposed → approved | rejected`, `approved → superseded`.
4. Serve as the stable identity that audit records, user feedback, and
   learned preferences reference.

---

## Non-Responsibilities

- No dependency ordering beyond narrative sequence.
- No retry policies, timeouts, or scheduling hints.
- No capability or tool references.
- No execution state. A Workflow is never "running" — its compilation is.
- Not authored by users. Users express Goals; Orbit proposes Workflows.
  (Deliberate constraint: the moment users author workflows directly, Orbit
  becomes a workflow editor instead of an intent system.)

---

## Inputs

- A Goal (from the Intelligence System).
- Planner context, assembled from a World State snapshot and Memory.
- Optionally: a prior Workflow being revised (strategy-level replanning).

---

## Outputs

- A versioned Workflow document. Immutable once approved; revisions create a
  new version carrying a `supersedes` pointer.

---

## Dependencies

- **Memory** — learned strategies and preferences shape step selection.
- **World State** — snapshot reference recorded for provenance.
- **Conversation System** — presents the Workflow for approval; the Workflow
  document itself has no UI knowledge.

---

## Internal Concepts

**Step.** A named, plain-language unit of strategy. Steps imply order but not
dependency structure; discovering true dependencies is the Compiler's job.

**Risk hint.** A step-level classification (`informational | mutating |
irreversible`) proposed by the Planner. It is a *hint*: the Safety System's
policy engine makes the binding decision at action dispatch. Hints exist so
the approval surface can be honest with the user before execution.

**Approval state.** `proposed`, `approved`, `rejected`, `superseded`.
Only `approved` Workflows may be compiled.

**Provenance.** `{ plannerVersion, contextSnapshotRef, createdAt }`.
`contextSnapshotRef` is what makes explanation possible later: not just
"what did Orbit plan" but "what did Orbit believe about the world when it
planned it."

Illustrative structure (not a schema commitment):

```
Workflow
├── id, version, supersedes?
├── goalRef
├── approvalState
├── steps[]: { name, intentSummary, riskHint }
└── provenance: { plannerVersion, contextSnapshotRef, createdAt }
```

---

## Lifecycle

1. Planner emits Workflow v1 in `proposed`.
2. The approval surface presents it. User approves, edits (→ v2), or rejects.
   Auto-approval under user policy is permitted for low-risk strategies.
3. An approved Workflow is handed to the Compiler.
4. Strategy-level replanning produces v(n+1) with `supersedes: v(n)`.
   Whether v(n+1) requires fresh approval is governed by the replan routing
   rule (see replanning.md).
5. Workflows are never deleted. They are the audit trail.

---

## Failure Modes

- **Planner cannot form a strategy** → no Workflow is emitted; a clarifying
  question is routed through the Conversation System. A vague Workflow is
  worse than a question.
- **User rejects repeatedly** → recorded as a Memory signal (learned
  preference), never handled as a retry loop.
- **Step drifts into implementation detail** → design smell. Review lint: if
  a step names a tool, an application, or a UI element, it belongs one level
  down.

---

## Architectural Invariants

1. Approved Workflows are immutable.
2. Every Workflow records the context snapshot it was planned against.
3. Workflows contain no tool, capability, or execution vocabulary.
4. Every user-facing explanation of Orbit's behavior resolves to a Workflow.

---

## Extensibility

- Step metadata (cost estimates, duration predictions) can be added without
  touching compilation; the Compiler reads only step names plus registry
  mappings.
- Workflow *templates* — learned, reusable strategies for recurring goals —
  are parameterized Workflows. Nothing downstream needs to know a Workflow
  came from a template.

---

## Open Questions

1. Auto-approval policy language: how do users express "never ask me about
   read-only steps again" without creating an unauditable bypass?
2. Edit semantics: when a user edits a proposed Workflow, is the edit a new
   Planner input (re-plan around the edit) or a direct document mutation?
   Leaning re-plan, to preserve "users don't author workflows."
3. Granularity guidance: what stops the Planner from emitting one giant step
   ("Do the thing") that technically satisfies the format?

---

## Future Evolution

- Workflow diffing in the approval surface ("here's what changed since the
  version you approved").
- Cross-session Workflow reuse ranked by outcome quality.
- Shared/team Workflows, which will force a permissions model onto the
  approval state machine.

---

## Design Review

- **Weakness:** risk hints duplicate judgment that the Safety System owns
  authoritatively; if hints and policy disagree, users may feel misled.
  Mitigation is honest labeling of hints as estimates — but the tension is
  real and documented rather than solved.
- **Assumption:** users will actually read Workflows before approving.
  Approval fatigue could hollow out the safety story; auto-approval policy
  design (open question 1) carries that risk.
- **Scalability concern:** "never deleted" is cheap for one user, unbounded
  for years of use. Needs an archival/compaction story eventually.
- **Unresolved tradeoff:** plain-language steps optimize for readability but
  make compilation dependent on capability-name matching quality. A
  controlled vocabulary would compile more reliably and read worse.
