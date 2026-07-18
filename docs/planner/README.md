# Planner Subsystem

> Version: 0.1 · Status: Draft · Last Updated: July 2026

## Purpose

The Planner subsystem owns everything between a well-formed Goal and an
executable Task Graph. It decides *how* Orbit will achieve what the user
wants, expresses that strategy in a human-reviewable form, and compiles it
into a machine-executable form.

The Planner thinks. It never acts.

## Subsystem Boundary

**Upstream:** receives a Goal from the Intelligence System.
**Downstream:** hands an executable Task Graph to the Scheduler.
**Consults:** Tool Registry (capability resolution), World State (snapshots),
Memory (preferences, learned strategies).

The Planner never invokes a Tool, never touches the OS, and never talks to
the user directly — clarification requests are routed through the
Conversation System.

## Documents

| Document | Owns |
|---|---|
| [workflow.md](workflow.md) | The human-reviewable strategy artifact |
| [task-graph.md](task-graph.md) | The compiled, executable DAG |
| [compiler.md](compiler.md) | The Workflow → Task Graph transformation |
| [replanning.md](replanning.md) | Divergence routing and replan levels |
| domain-model.md | (planned) Shared vocabulary: Goal, Task, Action |
| scheduler.md | (planned) Dispatch, parallelism, task state |

## Core Invariants (subsystem-wide)

1. The Planner never executes actions.
2. Plans are made against World State snapshots, never the live world.
3. Every executable artifact is traceable to a human-readable one.
4. Compilation is pure and deterministic.
5. Small failures replan below the approval line; strategy changes cross it.

## Design Review

- The Scheduler is currently grouped under `planner/` per the repository
  layout, but it consumes plans rather than producing them. If scheduler
  responsibilities grow (queueing, budgets, background execution), promote it
  to its own subsystem directory. Documented as an open structural question.
- The boundary between Intelligence and Planner is not yet ratified
  (see ADR-0001, pending). Until then, this subsystem assumes it receives a
  fully-formed Goal and owns nothing about intent understanding.
