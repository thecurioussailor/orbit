# Orbit Architecture

> Version: 0.1
>
> Status: Draft
>
> Last Updated: July 2026

---

# Overview

Orbit is an AI Operating Companion.

Unlike traditional AI assistants that primarily answer questions or execute isolated commands, Orbit is designed to become an intelligent operating layer between humans and computers.

Orbit understands user intent, observes the current state of the computer, plans multi-step workflows, executes those workflows safely across applications, and continuously learns from interaction.

The architecture is intentionally modular.

Every major capability is isolated into an independent system so that Orbit can continue evolving without requiring large architectural changes.

---

# Goals

The architecture should enable Orbit to:

- Understand natural language
- Operate desktop applications
- Operate web browsers
- Execute multi-step workflows
- Learn user preferences
- Remember previous work
- Ask for clarification whenever needed
- Execute safely
- Expand with new capabilities over time

---

# Non Goals

Orbit is not designed to be:

- another chatbot
- another browser automation tool
- another voice assistant
- another scripting language

Instead, Orbit acts as an intelligent operating layer capable of coordinating all of these capabilities together.

---

# Architectural Principles

The following principles guide every architectural decision.

---

## Intent Before Commands

Users communicate goals rather than individual actions.

Instead of:

> Open Chrome.

> Open Gmail.

> Search LinkedIn.

The user simply says:

> Find founders hiring frontend engineers.

Orbit determines the necessary workflow.

---

## Planning Before Execution

Orbit never executes immediately.

Every request is first analyzed, understood, planned, and validated before execution begins.

Planning is always separated from execution.

---

## Observe Before Planning

Planning requires context.

Before generating a plan, Orbit first observes the current state of the user's environment.

Examples include:

- currently active applications
- browser tabs
- clipboard
- notifications
- selected text
- running processes
- previous conversation
- stored memory

Orbit should avoid asking questions it already knows the answer to.

---

## Human Always In Control

Orbit should never remove the user from important decisions.

High impact actions always require explicit approval.

Examples:

- sending emails
- deleting files
- publishing content
- transferring money
- purchasing products

Automation should increase trust rather than reduce it.

---

## Learn Continuously

Orbit becomes more helpful over time.

The assistant gradually learns:

- preferred applications
- working hours
- recurring workflows
- active projects
- frequently visited websites
- communication style

Learning should improve the experience without becoming intrusive.

---

## Modular By Design

Orbit is composed of independent systems.

Each system owns a single responsibility.

New capabilities should be added without changing existing systems.

---

# High-Level System Architecture

```
                               User
                                 │
                                 ▼
                    Presentation System
                 (Voice • Chat • Interface)
                                 │
                                 ▼
                   Conversation System
          (Intent • Conversation State • History)
                                 │
                                 ▼
                    Observation System
      (Desktop • Browser • Memory • Context • State)
                                 │
                                 ▼
                    Intelligence System
              (Reasoning • Goal Understanding)
                                 │
                                 ▼
                     Planning System
                 (Task Graph Generation)
                                 │
                                 ▼
                         Scheduler
                                 │
                                 ▼
                      Safety System
                                 │
                                 ▼
                      Tool Registry
                                 │
      ┌──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼
 Browser         Desktop       Terminal         API Tools
 Executor        Executor      Executor        Executor
      └──────────────┴──────────────┴──────────────┘
                                 │
                                 ▼
                         Operating System
                                 │
                                 ▼
                           Observation
                         (Feedback Loop)
```

---

# Core Systems

---

# Presentation System

The Presentation System is responsible for all user interaction.

Responsibilities

- Voice Input
- Chat Interface
- Notifications
- Progress Updates
- Permission Dialogs

It never performs actions.

It simply provides a communication layer between the user and Orbit.

---

# Conversation System

Responsible for understanding conversations.

Responsibilities

- Natural language understanding
- Conversation history
- Reference resolution

Example

User:

> Reply to him.

Conversation resolves:

"Him" → Adam

before planning begins.

---

# Observation System

Orbit should never plan blindly.

Before every task it observes the current state of the computer.

Responsibilities

Desktop

- running applications
- active window
- clipboard
- notifications
- file explorer

Browser

- active tab
- page contents
- URL
- selected text

Memory

- user preferences
- recent work
- long-term knowledge

The observation system creates a snapshot of the current environment.

---

# Intelligence System

The Intelligence System understands user goals.

Responsibilities

- understand intent
- identify missing information
- detect ambiguity
- estimate confidence

The Intelligence System never executes work.

---

# Planning System

The Planning System converts goals into executable workflows.

Responsibilities

- break goals into tasks
- generate execution order
- select required capabilities
- request clarification when needed

Output

A Task Graph.

The planner never clicks buttons.

---

# Task Graph

The Task Graph represents the work Orbit intends to perform.

Example

Goal

Review recruiter emails

↓

Open Gmail

↓

Locate recruiter conversations

↓

Summarize

↓

Draft replies

↓

Wait for approval

Task Graphs allow Orbit to

- retry tasks
- pause execution
- resume execution
- parallelize work
- explain decisions

---

# Scheduler

The Scheduler decides how tasks are executed.

Responsibilities

- sequential execution
- parallel execution
- retries
- dependency resolution

The Scheduler does not plan.

It only schedules.

---

# Safety System

Every task passes through the Safety System.

Responsibilities

- classify risk
- request approval
- block dangerous actions
- verify permissions

Example

Safe

- open website
- search Google
- read webpage

Medium

- rename files
- download documents

High

- delete data
- send email
- purchase products

---

# Tool Registry

Orbit does not directly know how to control software.

Instead it discovers available capabilities through the Tool Registry.

Examples

Browser

Desktop

Filesystem

Terminal

GitHub

Calendar

Spotify

Slack

VS Code

Future integrations simply register themselves.

No planner changes required.

---

# Execution Systems

Execution Systems never make decisions.

They simply execute assigned tasks.

Examples

Browser Executor

Desktop Executor

Terminal Executor

Filesystem Executor

Cloud Executor

Every executor follows the same interface.

Input

Task

Output

Execution Result

---

# Knowledge System

Orbit stores information using two different layers.

---

## Memory

Long-term information.

Examples

- preferred browser
- recurring workflows
- favorite websites
- active projects
- communication style

Memory persists.

---

## Context

Temporary information.

Examples

- active window
- clipboard
- running applications
- browser state

Context changes continuously.

---

# Request Lifecycle

Every request follows the same lifecycle.

```
User Request

↓

Conversation

↓

Observation

↓

Intelligence

↓

Planning

↓

Task Graph

↓

Scheduler

↓

Safety

↓

Execution

↓

Observe Result

↓

Continue or Finish
```

Orbit continuously observes the result of execution.

If something changes unexpectedly, Orbit replans instead of blindly continuing.

---

# Feedback Loop

Orbit operates as a continuous loop.

Observe

↓

Think

↓

Plan

↓

Execute

↓

Observe Again

↓

Continue

This feedback loop allows Orbit to recover from failures and adapt to changing environments.

---

# Architectural Invariants

These rules should remain true regardless of implementation.

### Planner never executes actions.

---

### Executors never make decisions.

---

### Memory never controls execution.

---

### Every execution is observable.

---

### Every dangerous action requires approval.

---

### New capabilities should be plugins rather than modifications to the planner.

---

### Orbit always observes before planning.

---

### Every workflow should be explainable.

The user should always be able to understand why Orbit performed an action.

---

# Future Evolution

The current architecture is intentionally conservative.

Future versions may introduce:

- Multiple collaborating planners
- Autonomous background agents
- Local models
- Cloud execution
- Multi-device synchronization
- Plugin marketplace
- Team collaboration
- Personal knowledge graph
- Autonomous scheduling

These capabilities should extend the architecture rather than replace it.

---

# Closing Philosophy

Orbit is not designed to replace the user.

Orbit is designed to remove unnecessary interaction between human intent and computer execution.

The user should spend less time operating software and more time solving problems.

Every architectural decision should move Orbit closer to becoming an intelligent operating companion that understands, assists, and continuously improves alongside its user.
