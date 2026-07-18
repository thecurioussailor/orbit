# Compiler

> Version: 0.1 · Status: Draft · Last Updated: July 2026
> Subsystem: Planner

## Purpose

The Compiler owns the transformation from an approved Workflow into an
executable Task Graph. It is the only component allowed to produce Task
Graphs, and the boundary it implements is the load-bearing wall between the
human-readable and machine-executable halves of Orbit.

---

## Responsibilities

1. Resolve each Workflow step to one or more capabilities via the Tool
   Registry.
2. Derive true dependency structure (and therefore parallelism) from the
   step semantics.
3. Attach execution policy per Task from risk hints, user policy, and
   capability manifests.
4. Attach expected effects per Task from capability manifest declarations.
5. Emit diagnostics for anything unresolvable or ambiguous — before
   execution, never during.

---

## Non-Responsibilities

- No execution, no observation, no live-world queries.
- No strategy decisions. If a step cannot be fulfilled, the Compiler reports
  it; the Planner decides what to do about it.
- No user interaction. Ambiguity diagnostics are routed upward.

---

## Inputs

- Approved Workflow (specific version).
- Tool Registry (capability manifests).
- World State snapshot.
- User policy (approval and confirmation rules) from Memory.

---

## Outputs

- A Task Graph, or
- Diagnostics preventing compilation, with per-step attribution.

---

## Dependencies

Tool Registry, World State (snapshot interface only), Memory (policy read
only). Nothing downstream: the Compiler must not know the Scheduler exists.

---

## Internal Concepts

**The contract.** Compilation is a single function:

```
compile(workflow, toolRegistry, worldStateSnapshot, userPolicy)
    → TaskGraph | Diagnostics
```

**Capability resolution.** Matching a step's semantics to capability
manifests. Resolution is pinned: the chosen provider is recorded in the
Task, not re-decided at dispatch.

**Diagnostic.** A structured, step-attributed compilation failure. The
Compiler prefers refusing loudly over guessing quietly.

---

## Lifecycle

Stateless. Invoked on Workflow approval and on subgraph recompilation
requests from the replanning layer. Holds no state between invocations —
all inputs arrive as arguments.

---

## Failure Modes

- **No capability matches a step** → diagnostic; Planner revises strategy.
- **Multiple capabilities match with no preference** → diagnostic marked
  `needs-choice`; surfaced once, answer remembered.
- **Snapshot missing facts a manifest requires** → diagnostic requesting
  targeted observation, never a live query from inside the Compiler.

---

## Architectural Invariants

1. **Purity.** No side effects. Reads a snapshot; never queries the live
   world.
2. **Determinism.** Same four inputs, same output — this is what makes
   plans testable without a desktop.
3. **Totality of traceability.** Every Task carries `workflowStepRef`;
   every step maps to ≥1 Task or a diagnostic.
4. **Environment independence of the input.** The same Workflow compiles on
   any machine; only the output differs. "Also works on the laptop" must
   never require replanning — only recompiling.

---

## Extensibility

- Compilation strategies (minimize duration, minimize interruptions,
  minimize risk) as variants behind the single contract.
- Manifest-driven decomposition rules mean new integrations extend the
  Compiler's reach without modifying it.

---

## Open Questions

1. How is step→capability matching implemented — exact vocabulary, semantic
   matching by a model, or a hybrid? This decision dominates compilation
   reliability and belongs in an ADR before implementation.
2. Does the Compiler ever consult a language model? If yes, determinism
   requires pinned models and cached resolutions; if no, the Workflow
   vocabulary must be more controlled than "plain language" suggests.
   (This is the sharpest unresolved tension in the Planner.)

---

## Future Evolution

- Incremental compilation (only affected subgraphs) as graphs grow.
- Compile-time simulation: dry-run a graph against the snapshot to predict
  effects and surface a preview to the approval surface.

---

## Design Review

- **Weakness:** the purity invariant conflicts with any future in-compiler
  model call unless resolution caching is designed up front.
- **Assumption:** capability manifests are rich enough to derive
  dependencies. If manifests under-specify, dependency derivation degrades
  to "sequential everything," silently losing parallelism.
- **Scalability concern:** none at single-user scale; matching cost could
  matter with hundreds of registered capabilities.
- **Unresolved tradeoff:** open question 2 is a fork in the road — model-in-
  compiler buys flexibility and sells determinism. Documented, not decided.
