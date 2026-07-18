# Task Graph

> Version: 0.1 · Status: Draft · Last Updated: July 2026
> Subsystem: Planner

## Purpose

The Task Graph is the compiled, machine-executable form of an approved
Workflow: a DAG of Tasks with explicit dependencies, resolved capabilities,
execution policies, and expected effects. It is what the Scheduler consumes.

The Task Graph is the **compiled binary**: dependency-ordered, optimized for
parallelism, machine-specific. Nobody reviews a binary; nobody executes
source code.

---

## Responsibilities

1. Encode Tasks and their dependency edges — which the Workflow's narrative
   order only implies. This is where parallelism is discovered.
2. Bind each Task to a resolved capability (by name, from the Tool
   Registry), pinned at compile time.
3. Attach execution policy per Task: retries, timeout, idempotency flag,
   confirmation-required flag (derived from risk hint + user policy).
4. Declare **expected effects** per Task — observable World State changes the
   feedback loop uses to detect success and divergence.
5. Carry runtime state per Task:
   `pending → ready → dispatched → running → succeeded | failed | skipped | cancelled`.

---

## Non-Responsibilities

- No plain-language explanation. Traceability to the human level is via
  `workflowStepRef`, never duplicated text.
- No tool invocations. Tasks reference capabilities; capabilities decompose
  into Actions at dispatch time (capability resolution, see tool-registry/).
- No approval semantics. Approval happened one level up.
- Never edited by hand. A wrong graph means a wrong Workflow or a wrong
  capability manifest — fix the source and recompile.

---

## Inputs

- An approved Workflow (specific version).
- The Tool Registry (capability manifests).
- A World State snapshot (environment-dependent resolution: which browser,
  which applications are installed).

---

## Outputs

- An executable DAG handed to the Scheduler.
- Compile-time diagnostics: unresolvable steps ("no capability fulfills
  'Search LinkedIn'"), ambiguous resolutions requiring a choice.

---

## Dependencies

- **Compiler** — sole producer (see compiler.md).
- **Scheduler** — sole consumer and state mutator.
- **Tool Registry** — capability names and manifests referenced by Tasks.
- **World State** — snapshot at compile time; live comparison at runtime via
  expected effects.

---

## Internal Concepts

**Task.** One meaningful unit of work with state, dependencies, and policy.
Tasks can fail, retry, and be retried without re-approval.

**Dependency edge.** A strict happens-before relation. Absence of a path
between two Tasks is an explicit claim that they may run in parallel.

**Expected effect.** A predicate over World State that should hold after a
Task succeeds (e.g. `window_exists("Gmail")`, `url_matches(...)`). Expected
effects are the contract between execution and observation: without them the
feedback loop cannot distinguish success from coincidence.

**Execution policy.** Per-task runtime rules:
`{ retries, timeoutMs, requiresConfirmation, idempotent }`.

Illustrative structure:

```
TaskGraph
├── id, workflowRef (id + version), compiledAt
├── worldStateSnapshotRef
├── tasks[]
│     ├── id, workflowStepRef
│     ├── capabilityRef (name + resolved provider)
│     ├── params
│     ├── dependsOn: [taskId]
│     ├── policy
│     ├── expectedEffects[]
│     └── state + stateHistory[]
└── diagnostics[]
```

---

## Lifecycle

1. Compiler produces the graph from an approved Workflow. Compilation is
   pure: same inputs, same graph.
2. Scheduler executes. Task states mutate; graph structure does not.
3. Task-level replanning recompiles affected subgraphs into a new graph
   version — edges are never mutated in place.
4. On Workflow supersession, the old graph is cancelled and a new one
   compiled. Completed idempotent Tasks may be credited forward; that
   optimization lives in the Compiler and nowhere else.
5. Terminal graphs (all Tasks terminal) are archived with full state history
   for audit and learning.

---

## Failure Modes

- **Unresolvable step at compile time** → fail loudly before execution
  starts. Never dispatch a partially-resolvable graph.
- **Stale snapshot** (world changed between compile and dispatch) → detected
  as divergence between expected preconditions and observed state; triggers
  task-level recompile, not blind retry.
- **Ambiguous capability resolution** (two providers fit) → resolved by
  learned preference from Memory; if none exists, surface the choice once
  and remember the answer.

---

## Architectural Invariants

1. **The sync-leak test.** No field may appear in both Workflow and Task
   Graph requiring manual consistency. The graph must be fully derivable
   from (Workflow, Tool Registry, World State snapshot). Defend this in
   every code review.
2. Graph structure is immutable post-compilation; only Task state mutates.
3. Every Task is traceable to a Workflow step.
4. A Task Graph never outlives the approval of the Workflow it was compiled
   from.

---

## Extensibility

- New execution policies (rate limits, cost budgets, scheduling windows) are
  new `policy` fields, invisible to the Workflow layer.
- Alternative compilation strategies (optimize for speed vs. minimal user
  interruption) are Compiler variants behind one interface.

---

## Open Questions

1. Expected-effects predicate language: how expressive before it becomes a
   second planner? Starting position: a small closed set
   (`window_exists`, `url_matches`, `file_present`) and no generalization
   until three real capabilities demand it.
2. Subgraph recompilation identity: when a subgraph is recompiled, do
   downstream audit records reference the old graph, the new one, or a
   lineage chain?
3. Partial-progress crediting: what proves an idempotent Task's prior result
   is still valid under a new snapshot?

---

## Future Evolution

- Cost- and duration-annotated graphs enabling "this will take about 4
  minutes and needs your approval twice" summaries before execution.
- Speculative parallel branches with cancellation (try Gmail and Outlook
  simultaneously, keep whichever resolves).
- Cross-device graphs, which will force serialization and capability
  negotiation between machines.

---

## Design Review

- **Weakness:** state history per Task grows unbounded on long-running
  recurring workflows; needs retention policy.
- **Assumption:** capability resolution at compile time stays valid until
  dispatch. On a busy desktop this window can be seconds-to-minutes; the
  stale-snapshot failure mode carries the load, and its detection depends
  entirely on expected-effects quality.
- **Scalability concern:** "recompile, never mutate" is clean but could
  thrash on highly dynamic environments (recompile storms). May need
  debouncing at the replanning layer.
- **Unresolved tradeoff:** pinning providers at compile time gives
  determinism but forfeits opportunistic substitution at dispatch (Chrome
  crashed, Firefox is right there). Deliberately choosing determinism first.
