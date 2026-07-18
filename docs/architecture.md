# Architecture

## Overview

Orbit is designed as an AI operating companion rather than a traditional assistant.

Instead of executing predefined commands, Orbit understands user intent, plans multi-step workflows, interacts with applications, and continuously learns how the user works.

The architecture is modular by design.

Every capability—browser automation, desktop automation, memory, voice interaction, or future integrations—should be implemented as an independent component that communicates through a central planning system.

---

# Core Principles

Orbit follows several architectural principles.

## Separation of Responsibilities

Every component has one responsibility.

The planner plans.

The browser agent controls browsers.

The desktop agent controls the operating system.

Memory stores knowledge.

Conversation handles communication.

No component should perform another component's job.

---

## Planner-Centric Design

Every user request flows through the Planner.

No automation component should directly decide what to do.

Instead, automation components execute plans produced by the planner.

This keeps behavior predictable and explainable.

---

## Human In Control

Orbit should never perform important actions without confirmation.

Examples include:

- sending emails
- deleting files
- publishing content
- transferring money

The planner determines whether confirmation is required before execution.

---

## Modular Architecture

Orbit should allow new capabilities to be added without changing the rest of the system.

Future modules should simply register themselves with Orbit.

Examples:

- GitHub Agent
- Slack Agent
- Spotify Agent
- Calendar Agent
- WhatsApp Agent

---

# High-Level Architecture

```

+----------------------------+
| User |
+-------------+--------------+
|
v
+----------------------------+
| Voice / Chat UI |
+-------------+--------------+
|
v
+----------------------------+
| Conversation Manager |
+-------------+--------------+
|
v
+----------------------------+
| Planner |
+-------------+--------------+
|
+--------+--------+---------+
| | |
v v v
Browser Desktop Memory
Agent Agent
| | |
+--------+--------+
|
v
Operating System

```

---

# System Components

## Presentation Layer

Responsible for communication with the user.

Responsibilities

- Voice
- Chat
- Notifications
- Action approvals
- Progress updates

Never performs actions.

---

## Conversation Manager

Responsible for understanding user requests.

Responsibilities

- Maintain conversations
- Resolve references
- Track user intent
- Handle clarification

Example

User:

> Reply to him.

Conversation Manager resolves:

"Him" → Adam

before sending the request to the planner.

---

## Planner

The Planner is the brain of Orbit.

Responsibilities

- Understand goals
- Break work into steps
- Select tools
- Decide execution order
- Evaluate confidence
- Ask for clarification
- Generate execution plans

The Planner never clicks buttons.

It only creates plans.

---

## Execution Layer

The execution layer performs work.

It never makes decisions.

Execution consists of multiple independent agents.

### Browser Agent

Responsible for

- opening websites
- reading pages
- clicking buttons
- filling forms
- extracting information

---

### Desktop Agent

Responsible for

- launching applications
- mouse
- keyboard
- clipboard
- windows
- file explorer

---

### Terminal Agent

Responsible for

- shell commands
- development workflows
- git
- npm
- cargo

---

### File Agent

Responsible for

- reading files
- writing files
- moving files
- searching files

---

# Knowledge Layer

Orbit remembers information through dedicated systems.

## Memory

Stores long-term knowledge.

Examples

- preferred browser
- work schedule
- active projects
- favorite websites

---

## Context

Stores temporary knowledge.

Examples

- active window
- clipboard
- browser tabs
- selected text
- running applications

Context changes continuously.

Memory persists.

---

# Execution Flow

Every request follows the same lifecycle.

User

↓

Conversation

↓

Planner

↓

Need clarification?

↓

Yes → Ask User

↓

No

↓

Generate Plan

↓

Permission Check

↓

Execute

↓

Observe Result

↓

Complete

---

# Safety

Actions are classified into three categories.

Safe

- open browser
- search website
- read page

Medium

- rename file
- download file

Dangerous

- send email
- delete data
- transfer money

Dangerous actions always require user approval.

---

# Future Expansion

Orbit is designed to support unlimited future agents.

Examples include

- GitHub
- Slack
- Discord
- Spotify
- Gmail
- Calendar
- Figma
- VS Code
- Docker
- Kubernetes

These should integrate without modifying the planner itself.

---

# Philosophy

Orbit is not a chatbot.

Orbit is not desktop automation.

Orbit is not voice control.

Orbit is an AI operating layer that connects human intent with computer execution while continuously learning how its user works.
