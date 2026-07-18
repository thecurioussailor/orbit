# Orbit Architecture

> Version: 0.2 · Status: Draft · Last Updated: July 2026
> Supersedes: 0.1 (Intelligence System → Goal Builder; Context → World State;
> shared systems modeled as horizontal services; Tool Registry removed from
> the pipeline)

---

## Overview

Orbit is an AI Operating Companion: an intelligent operating layer between
humans and computers. Users express goals in natural language. Orbit
observes the environment, plans workflows, executes them safely across
applications, and learns how the user works.

This document describes only how major systems interact. Subsystem detail
lives in each subsystem's own directory. If a section here starts growing,
it is trying to become a subsystem document — split it.

---

## Architectural Shape

Orbit is a **request pipeline** operating over a set of **horizontal
services**, closed into a loop by **observation**.

```
        User
          │
  Presentation ──────────────┐
          │                  │        Horizontal services
  Conversation               │        (consulted, never stages)
          │                  │        ┌────────────────────────┐
   Goal Builder ── Goal      │        │  World State           │
          │                  │        │  Memory                │
      Planner ── Workflow ───┘        │  Tool Registry         │
          │      (approval)           │  Safety Policy Engine  │
      Compiler ── Task Graph          │  Sessions              │
          │                           │  Learning              │
     Scheduler                        └────────────────────────┘
          │                                      ▲
     Executors                                   │
          │                                      │
  Operating System                               │
          │                                      │
   Observation ──────── updates World State ─────┘
```

**Pipeline stages** transform a request: each consumes the previous stage's
output and produces exactly one artifact type.

**Horizontal services** hold shared state and shared judgment. They are
consulted by stages; they never sit between stages, and a request never
"passes through" them.

**Observation** runs continuously, not as a stage. It updates World State
whenever the environment changes — including changes caused by Orbit's own
executors, which is what closes the loop and enables replanning.

---

## The Request Pipeline

| Stage | Consumes | Produces | Must never |
|---|---|---|---|
| Presentation | user input, system output | rendered interaction | perform actions |
| Conversation | dialogue turns | resolved utterances, history | plan or execute |
| Goal Builder | resolved utterances + context | a well-formed **Goal** | pass ambiguity downstream |
| Planner | Goal | **Workflow** (human-reviewable) | execute, talk to the user directly |
| Compiler | approved Workflow | **Task Graph** (executable) | query the live world |
| Scheduler | Task Graph | dispatched Tasks | plan |
| Executors | Tasks (as Actions) | execution results | decide |

The Goal Builder is the pipeline's quality gate: the Planner only ever
receives valid, unambiguous Goals. When clarification is needed, the Goal
Builder asks — routed through Conversation and Presentation — before
anything reaches the Planner. (See ADR-0001.)

---

## Horizontal Services

| Service | Owns | Primary consumers |
|---|---|---|
| World State | observed, timestamped, volatile facts about the environment | Goal Builder, Planner, Compiler, Replanning |
| Memory | interpreted, persistent knowledge: preferences, habits, projects | Goal Builder, Planner, Compiler, Learning |
| Tool Registry | capability manifests and provider bindings | Compiler, Executors, Safety |
| Safety Policy Engine | risk evaluation and approval decisions, per action at dispatch | Scheduler/Executors (dispatch-time), Presentation (approval UI) |
| Sessions | named scopes over related goals and session memory | Conversation, Goal Builder, Memory |
| Learning | turning outcomes and feedback into Memory updates | Memory (write path) |

**Service dependency rule:** stages consult services; services never consult
stages. Service-to-service dependencies are individually declared:

- Learning → Memory (permitted: it is Learning's write path)
- Safety → Tool Registry (permitted: authoritative risk classes live in
  capability manifests)
- All others: prohibited until justified by an ADR.

Safety is a policy engine consulted **per action at dispatch time**, not a
pipeline checkpoint. A plan approved as a whole can still contain an action
that policy blocks at the moment of execution; the reverse — a stage-level
pass allowing later unchecked actions — must be impossible.

---

## The Feedback Loop

Every Task declares expected effects — predicates over World State.
Observation continuously updates World State; divergence between expectation
and observation is routed by the replanning rule
(planner/replanning.md): small failures heal below the approval line,
strategic changes cross it.

The loop, not the pipeline, is Orbit's defining property. A pipeline runs
once and hopes; the loop observes, acts, re-observes, and adapts.

---

## Architectural Invariants

1. The Planner never executes actions; Executors never make decisions.
2. Planning happens against World State snapshots, never the live world.
3. The Planner never interacts with the user; all dialogue flows through
   Conversation and Presentation.
4. Every executable artifact is traceable to a human-readable one.
5. Every dangerous action is evaluated by the Safety Policy Engine at
   dispatch time.
6. Memory never controls execution.
7. New capabilities are registered in the Tool Registry as plugins; the
   Planner and Compiler are never modified to add an integration.
8. Every workflow is explainable: the user can always be shown what Orbit
   intended and what it believed when it planned.
9. Stages consult services; services never consult stages.

---

## Subsystem Documentation

| Directory | Status |
|---|---|
| planner/ (workflow, task-graph, compiler, replanning) | drafted |
| tool-registry/ (capabilities, providers) | capabilities drafted |
| memory/ (world-state, session, working, long-term) | planned |
| execution/ (browser, desktop, terminal, filesystem) | planned |
| safety/ (policies, approvals) | planned |
| decisions/ (ADRs) | ADR-0001, ADR-0002 |

---

## Future Evolution

Multiple collaborating planners, autonomous background agents, local
models, cloud execution, multi-device synchronization, plugin marketplace.
Each must extend this shape — new stages, new services, new capabilities —
rather than replace it.

---

## Design Review

- **Assumption:** a single linear pipeline suffices. Background/proactive
  goals (future) will need a second entry point into Goal Builder that
  doesn't originate from Presentation; the shape allows it but it is
  undesigned.
- **Weakness:** "Learning" is currently a named box with one declared edge;
  it is the least specified service and the most likely to grow tentacles.
  Constrain it early.
- **Scalability concern:** World State as a service consulted by everything
  makes it a contention point; snapshot semantics (already required by the
  Compiler) are also the mitigation.
- **Unresolved tradeoff:** per-action safety evaluation maximizes safety and
  interrupts flow; batching approvals at workflow level maximizes flow and
  weakens guarantees. Current position: evaluate per action, *ask* in
  batches where policy allows.
