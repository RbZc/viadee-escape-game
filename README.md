# viadee Escape Game (SE Lab 2026)

A single-player, point-and-click escape game delivered as a platform-independent web application. The game is designed to engage viadee employees with practical IT security topics through short, interactive scenarios—ideal as an entertaining learning break during the workday.

This repository contains the core game engine and the web application (frontend + backend), including scenario authoring capabilities for non-technical content creators.

## Goals

- Provide a **responsive browser-based** escape game playable on desktop, tablet, and mobile.
- Offer a **scenario editor** enabling non-technical users to create and maintain rooms, views, hotspots, and item interactions.
- Support **sessions and persistence** (save-games, progress tracking) in a permanent database.
- Keep the **core engine generic** so scenarios/puzzles can be authored independently of the underlying implementation.

## Core Features

### Must-have
- Backend for game logic, sessions, and persistence (save-games).
- Registration and homepage.
- Browser-based frontend with responsive UI.
- Play through scenarios consisting of multiple rooms and views.
- Scenario creation and administration (including images and interactions) for non-technical users.
- Different views, actions, and states per room.
- Items that enable transitions and change state.
- Inventory system (persistent and displayed in the UI).
- A basic scenario with **3–4 rooms**.

### Nice-to-have
- Easter eggs.
- Multiple scenarios.
- Save-games & resume from stored state.
- Completion certificate.

## Suggested Tech Stack (adjustable)

The stack is flexible. A recommended approach for this project is:

- **Vaadin Hilla** (Java backend with a modern TypeScript/React UI)
- Database: **SQL (e.g., PostgreSQL)** or **NoSQL** depending on preference
- Optional: AI-generated assets (license keys provided separately)

> If you choose a different stack, keep the domain model and API boundaries intact so the engine remains portable.

## Repository Structure (planned)

- `backend/` — domain model, game engine, persistence, APIs
- `frontend/` — responsive UI (game client + editor UI)
- `docs/` — requirements, architecture, data model
- `.github/` — CI workflows, issue templates (later)

## How the Game Works (concept)

Players navigate rooms and views via images and hotspots. Hotspots can:
- pick up items
- transition to another view/room
- change state flags
- consume / require inventory items

The inventory is shown persistently (e.g., at the bottom of the screen). Items can be used on hotspots to trigger interactions (e.g., use key card on reader).

## Licensing

The **core game engine** is intended to be MIT-licensed (excluding scenario content/puzzles if desired). See `LICENSE` once added.

## Contributing (SE Lab)

This is a student project developed in collaboration with viadee. Please keep contributions aligned with:
- maintainable domain model
- simple authoring workflow for non-technical users
- security best practices (as the app is security-themed)

See `docs/requirements.md` and `docs/architecture.md`.
