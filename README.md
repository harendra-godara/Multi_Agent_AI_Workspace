# Multi-Agent AI Workspace — CS543 Web Services Assignments 1–6

This repository contains CS543 Web Services Assignments 1–6 implemented/documented for the same Multi-Agent AI Workspace project.

## Project
A user submits a complex task. Authentication and workspace access are checked, the Workspace & Task service starts a workflow, an Orchestrator decomposes the task, specialized agents execute subtasks using shared context, Testing and Review validate the result, and the Execution & Artifact service stores outputs and logs.

## Services
- Identity & Access Service — Harendra Godara
- Workspace & Task Service — Harendra Godara
- AI Agent Service — Mohit Tailor
- Execution & Artifact Service — Anurag Sharma
- Frontend/UI — Harshita Rathore

## Assignments
- Assignment 1: HTTP by Hand & Project Setup
- Assignment 2: Services, Contracts & Schema
- Assignment 3: SOAP partner integration
- Assignment 4: REST/OpenAPI service
- Assignment 5: HTTP methods, headers, caching and retries
- Assignment 6: Honest responses, status codes, errors and validation

## Run
```bash
cd services/workspace-task-service
npm install
node server.js
```
The implementation uses an in-memory store for the course prototype. No `node_modules` or `.env` is included in the submission zip.
