# Capabilities

> Version: 0.1 · Status: Draft · Last Updated: July 2026
> Subsystem: Tool Registry

## Purpose

The Capability Registry is the catalog of everything Orbit can do, expressed
as declarative manifests. It exists so that the planning half of Orbit can
reason about *what* is possible without knowing *how* anything is done, and
so that new integrations extend Orbit by registration rather than by
modifying core systems.

A **capability** is an abstract, named operation ("open a URL", "send an
email"). A **provider** is a concrete implementation of a capability
("open a URL via Chrome through the browser executor"). This document
specifies capabilities and their manifests; provider registration, health,
and selection are specified in providers.md (planned).

---

## Responsibilities

1. Define the capability manifest format — the contract every integration
   must satisfy to make itself available to Orbit.
2. Validate manifests at registration time; reject malformed or conflicting
   declarations before they can influence planning.
3. Answer resolution queries from the Compiler: "which capabilities can
   fulfill this step, and what do they require and produce?"
4. Answer binding queries from Executors: "which provider implements this
   capability, decomposed into which action templates?"
5. Serve as the authoritative source of per-capability **risk class** and
   **required permissions** for the Safety Policy Engine.

---

## Non-Responsibilities

- Never executes anything. Registration and lookup are pure data
  operations; no integration code runs inside the registry.
- Never chooses strategy. The registry answers "what is possible"; the
  Planner decides "what to do"; the Compiler decides "which match."
- Never evaluates safety. It *stores* risk classes; the Safety Policy
  Engine *judges* them against user policy.
- Never observes. Availability preconditions are predicates evaluated
  against World State by consumers, not checked live by the registry.

---

## Inputs

- Capability manifests, from built-in integrations and plugins, at
  registration time.
- Resolution queries (Compiler) and binding queries (Executors) at runtime.

---

## Outputs

- Validated capability catalog.
- Resolution results: matching capabilities with their manifests.
- Registration diagnostics: validation failures, name conflicts,
  permission escalations relative to a previous version.

---

## Dependencies

- **World State** — indirectly: manifests reference World State predicates
  by name, so the predicate vocabulary must be defined in
  memory/world-state.md and versioned with it.
- **Safety Policy Engine** — reads risk classes and permissions from
  manifests; the registry has no dependency in the other direction.

---

## Internal Concepts

**Capability.** A named, versioned, declarative unit of ability:

```
Capability
├── name            namespaced verb, e.g. browser.open_url, email.send
├── version         semver; breaking manifest changes bump major
├── description     semantic description used for step matching
├── params          typed schema for invocation parameters
├── preconditions[] World State predicates that must hold to attempt it
├── effects[]       World State predicates expected to hold on success
├── risk            informational | mutating | irreversible
├── permissions[]   e.g. network, filesystem.write, credentials.email
└── decomposition   ordered action templates the executor will perform
```

**Effects are load-bearing.** A Task's `expectedEffects` (task-graph.md) are
sourced *from the manifest*, not invented by the Compiler. This makes the
manifest the single point of truth connecting planning, execution, and the
feedback loop: if a capability lies about its effects, divergence detection
breaks for every workflow that uses it.

**Risk class is authoritative here.** The Workflow's per-step risk *hint* is
the Planner's estimate for the approval surface; the manifest's risk class
is ground truth per capability, and the Safety Policy Engine judges from the
manifest. This resolves the hint-vs-policy tension flagged in workflow.md's
design review: hints inform humans, manifests bind machines.

**Action template.** A parameterized, atomic operation in an executor's
vocabulary (`launch(app)`, `navigate(url)`, `wait_for(predicate)`,
`click(target)`). Decomposition is declared in the manifest so that
executors stay decision-free: at dispatch, an executor instantiates the
templates with the Task's params — it never chooses among alternatives.

**Namespace.** The prefix before the verb (`browser.*`, `filesystem.*`,
`email.*`). Namespaces are claimed at registration; two plugins cannot
claim the same capability name. Same-name-different-namespace is allowed
and expected (`gmail.send`, `outlook.send` may both also register as
providers of abstract `email.send`).

---

## Lifecycle

1. **Registration.** At startup and on plugin install, manifests are loaded
   and validated: schema validity, name/namespace conflicts, references to
   known World State predicates, permission declarations.
2. **Version upgrade.** A new manifest version replacing an old one is
   diffed; **permission escalations and risk-class increases require
   explicit user re-consent** — silently widening what a plugin may do is
   the supply-chain attack surface of this architecture.
3. **Query.** Compiler resolution and executor binding, both read-only.
4. **Deregistration.** Removing a capability invalidates compiled Task
   Graphs that pin it; those graphs are cancelled and recompiled, surfacing
   diagnostics if steps become unresolvable.

---

## Failure Modes

- **Name conflict at registration** → reject the later registrant with a
  diagnostic; never silently shadow.
- **Manifest references unknown predicates** → reject at registration.
  Unknown vocabulary discovered at compile time would push failures to the
  worst possible moment.
- **Overclaimed effects** (capability declares effects its provider doesn't
  produce) → not detectable at registration; detected statistically at
  runtime as recurring divergence on one capability. Learning should flag
  "this capability's effects fail verification unusually often" as a
  trust signal.
- **Under-declared permissions** (capability does more than it declared) →
  cannot be caught by the registry; this is the executor sandbox's job
  (execution/ docs, planned). The registry's role is making the declaration
  *exist* so there is something to enforce.

---

## Architectural Invariants

1. Registration executes no integration code. Manifests are data.
2. The Planner and Compiler see capability names, descriptions, params,
   preconditions, effects, and risk — never tools, executors, or
   decomposition internals.
3. Every Task's expected effects trace to manifest-declared effects.
4. Risk classes and permissions read by Safety come only from validated
   manifests, never from runtime claims.
5. Permission escalation between manifest versions requires user consent.

---

## Extensibility

- New executors introduce new action-template vocabularies; the manifest
  format is agnostic to them.
- Abstract capabilities (`email.send`) with multiple concrete providers are
  the mechanism for provider substitution — designed in providers.md.
- Manifest fields are additive: cost estimates, typical duration, and
  quality hints can be added without breaking existing consumers.

---

## Open Questions

1. **Step→capability matching mechanism** (shared with compiler.md open
   question 2): exact vocabulary, model-based semantic matching, or hybrid?
   The manifest's `description` field is designed to support semantic
   matching, but the determinism question is unresolved. Needs ADR-0003.
2. **Predicate vocabulary ownership.** Manifests reference World State
   predicates; World State is undesigned. The predicate set must be
   co-designed with memory/world-state.md — flagging the dependency now.
3. **Trust model for third-party manifests.** A plugin marketplace (future)
   makes "manifest declares risk: informational" an attack vector. Signing,
   curation, sandbox-verified effects? Undecided; must be decided before
   any third-party plugin loads.
4. **Permission granularity.** `filesystem.write` vs
   `filesystem.write:/home/user/projects/**` — coarse is simple and
   over-grants; fine is safe and unmanageable. Leaning coarse now with a
   granularity-ready syntax.

---

## Future Evolution

- Capability marketplace with signed manifests and reputation.
- Effect verification harness: a test mode that executes a capability in a
  sandbox and checks declared effects against observed ones before
  admitting it to the catalog.
- Learned capability quality: success rates and divergence rates per
  capability feeding provider selection.

---

## Design Review

- **Weakness:** the registry's guarantees are only as good as manifest
  honesty, and two of the four failure modes (overclaimed effects,
  under-declared permissions) are undetectable at registration. The
  architecture compensates downstream (statistical detection, executor
  sandboxing) — both currently undesigned.
- **Assumption:** decomposition-as-declaration is expressive enough.
  Conditional decompositions ("if not logged in, log in first") strain a
  declarative template list; the escape hatch is splitting into finer
  capabilities with preconditions, which may proliferate capabilities.
- **Scalability concern:** semantic matching over hundreds of capability
  descriptions per compile; caching resolutions is the likely answer and
  interacts with the Compiler's determinism invariant — conveniently, in
  the same direction.
- **Unresolved tradeoff:** rich manifests raise integration quality and the
  barrier to writing integrations. A minimal "quick manifest" tier would
  lower the barrier and weaken the guarantees. Not deciding yet.
