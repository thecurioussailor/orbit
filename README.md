# Orbit

> An AI operating companion that understands your work, operates your computer, and learns how you work over time.

---

## Overview

Orbit is building a new way to interact with computers.

Today's AI assistants are excellent at answering questions, writing code, and generating content. Yet when it comes to actually getting work done, we still spend our days opening applications, switching tabs, navigating websites, filling forms, searching for information, and repeating the same workflows over and over again.

Orbit aims to change that.

Instead of telling your computer *how* to do something, you simply tell Orbit *what* you want to accomplish.

For example:

> "Check my important emails, summarize anything urgent, open YC Jobs, find interesting founding engineer roles, and prepare everything I need to review."

Orbit understands the goal, plans the necessary steps, interacts with your desktop and browser, asks for clarification when needed, and executes the workflow while keeping you in control.

The computer becomes something you collaborate with rather than manually operate.

---

## Why Orbit?

Modern computing is still built around manual interaction.

Every day we:

- Open the same applications
- Search for the same websites
- Switch between dozens of tabs
- Read repetitive emails
- Fill the same forms
- Repeat identical workflows

AI can already understand what we want.

Orbit bridges the gap between **understanding intent** and **executing work**.

---

## Vision

Orbit is not another chatbot.

It is an AI operating layer for personal computing.

Its goal is to become an intelligent companion capable of:

- Understanding natural language
- Planning multi-step tasks
- Operating desktop applications
- Navigating websites
- Executing workflows across multiple apps
- Learning user preferences
- Remembering context
- Automating repetitive work
- Proactively assisting when appropriate

Over time, Orbit should feel less like software and more like an experienced coworker that understands how you work.

---

## Design Principles

Orbit is built around a few core principles.

### Intent over Commands

Users should express goals—not individual actions.

Instead of saying:

```
Open Chrome
Open Gmail
Open LinkedIn
Search YC
```

The user simply says:

> "Find promising AI startups hiring founding engineers."

Orbit determines the required steps.

---

### Human Always in Control

Orbit should never make important decisions on behalf of the user.

Whenever confidence is low or an action could have meaningful consequences, Orbit asks before proceeding.

Automation should increase trust—not reduce it.

---

### Learns Over Time

Orbit should gradually understand:

- daily routines
- preferred tools
- recurring workflows
- active projects
- working habits

The assistant becomes more useful the longer it is used.

---

### Modular by Design

Orbit is built as a collection of independent agents responsible for planning, memory, browser automation, desktop automation, voice interaction, and future capabilities.

Every component should be replaceable and extensible.

---

## Example

Morning.

You open your laptop.

Orbit says:

> Good morning.

> You have two recruiter replies, one YC startup posted a new founding engineer role, and your portfolio received new visitors yesterday.

> Would you like me to prepare your workspace?

You answer:

> Yes.

Orbit opens:

- Chrome
- Gmail
- YC Jobs
- LinkedIn
- VS Code
- Terminal

Then summarizes everything important before you even ask.

---

## Current Status

Orbit is currently in its architecture and research phase.

The initial MVP focuses on:

- Voice interaction
- Browser automation
- Desktop automation
- Planning engine
- Memory
- Safe task execution

---

## Planned Tech Stack

- Rust
- Tauri
- React
- TypeScript
- Playwright
- SQLite
- OpenAI / Claude / Gemini
- Whisper

---

## Long-Term Goal

The long-term goal isn't to replace the keyboard or mouse.

It's to eliminate the repetitive work between deciding what needs to be done and actually getting it done.

Orbit should become the intelligent operating companion that sits between people and their computers.

---

> Think less. Build more. Let Orbit handle the rest.
