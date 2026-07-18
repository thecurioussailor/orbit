# Replanning

> Version: 0.1 · Status: Draft · Last Updated: July 2026
> Subsystem: Planner

## Purpose

Replanning owns Orbit's response to divergence — the moment observed reality
stops matching the plan's expectations. It routes each failure to the
correct level of the planning stack, so small failures heal silently and
strategic changes reach the user.

This document exists because the feedback loop is Orbit's defining
architectural property, and without an explicit routing rule every component
invents its own failure handling.

---

## Responsibilities

1. Classify divergence signals (failed expected effects, precondition
   violations, executor errors) by severity and level.
2. Route each divergence to exactly one replan level.
3. Debounce and aggregate divergence signals to prevent recompile storms.
4. Decide when a superseding Workflow requires fresh user approval.

---

## Non-Responsibilities

- Does not retry actions (executor policy owns that).
- Does not compile (Compiler owns that).
- Does not detect divergence (Observation owns that — replanning consumes
  divergence events, it does not produce them).

---

## Inputs

- Divergence events from the Observation System (expected effect failed,
  precondition no longer holds).
- Task failure reports from the Scheduler (retries exhausted).
- Compilation diagnostics from recompile attempts.

---

## Outputs

- Recompile requests to the Compiler (task-level).
- Strategy revision requests to the Planner (workflow-level).
- Clarification or approval requests routed via the Conversation System.

---

## Dependencies

Observation (event source), Scheduler (failure reports), Compiler,
Planner, Conversation System (user-facing escalations only).

---

## Internal Concepts

**Divergence.** Any observed contradiction of a plan's expectations:
a failed expected effect, a violated precondition, or an execution error
that survives retry policy.

**Replan level.** The layer at which correction happens: action, task,
workflow, or goal.

**The approval line.** The boundary between corrections Orbit performs
autonomously and those requiring the user.

---

## The Routing Rule

| Divergence | Replan level | User involved? |
|---|---|---|
| Action failed (selector missing, window moved) | Executor retries within Task policy | No |
| Task failed after retries; capability re-resolvable | Recompile affected subgraph | No |
| Task unfulfillable by any capability | Revise Workflow | Yes, if revision touches approved steps or raises risk class |
| Goal unachievable or ambiguous | Return to conversation | Yes |

**Principle: small failures stay below the approval line; strategic changes
cross it.** Every component that handles failure should cite this rule
rather than inventing its own escalation logic.

---

## Lifecycle

Event-driven and continuous. Active whenever any Task Graph is
non-terminal. Maintains a short-lived divergence buffer per graph for
debouncing; holds no long-term state.

---

## Failure Modes

- **Recompile storm** (environment churning faster than recompilation) →
  debounce window, then escalate one level up rather than looping.
- **Oscillation** (recompiled subgraph re-fails identically) → bounded
  attempts per level (default: 2), then forced escalation.
- **Divergence during an irreversible Task** → never auto-replan mid-task;
  pause the graph and surface state to the user. Safety over liveness.

---

## Architectural Invariants

1. Every divergence is handled at exactly one level per occurrence.
2. Escalation only moves upward; a workflow revision never silently degrades
   into a task retry.
3. No replan level may skip the approval line on its way up.
4. Replanning never mutates a Task Graph in place — correction is always
   recompilation or supersession.

---

## Extensibility

- New divergence classes (cost overrun, deadline slip) plug in as new event
  types with routing entries — the rule table grows, the mechanism doesn't.
- Learned escalation: Memory can eventually inform "this user prefers being
  asked earlier for this class of failure."

---

## Open Questions

1. Precise definition of "raises risk class" for re-approval — is adding an
   informational step to an approved Workflow silent, or does any structural
   change re-trigger approval?
2. Debounce parameters: fixed windows or adaptive to observation frequency?
3. Where does the divergence buffer live if Orbit restarts mid-execution?

---

## Future Evolution

- Predictive replanning: recompiling *before* failure when observation
  trends indicate an expectation will soon break.
- Post-hoc learning: feeding divergence histories to Memory so the Planner
  avoids strategies that historically diverge.

---

## Design Review

- **Weakness:** the routing table assumes divergences arrive as discrete
  classifiable events; real desktops produce noisy, overlapping signals.
  Classification quality is unproven.
- **Assumption:** two attempts per level is a sane oscillation bound;
  no evidence yet, revisit with telemetry.
- **Scalability concern:** one divergence buffer per active graph is fine
  for a single user; background autonomous agents (future) multiply this.
- **Unresolved tradeoff:** pausing on divergence during irreversible tasks
  favors safety over completion speed; some users will find this timid.
  Policy hook, not a constant, is the likely resolution.
