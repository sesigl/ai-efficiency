# AI Efficiency Benchmark

A project designed to measure agentic AI coding performance. AI coding agents implement features based on a well-defined specification via API-level tests.

## Purpose

This repository is structured specifically for evaluating how efficiently AI coding agents can implement features when working with a well-defined specification via API-level tests.

### API-Level Tests Only

**Intentionally, all tests in this repository are at the API level.** This design choice ensures:

1. **Behavior-Driven Specification**: Tests define the expected external behavior without prescribing internal implementation details
2. **Implementation Freedom**: AI agents (or human developers) can choose any internal architecture, patterns, or code structure
3. **Measurable Outcomes**: Success is objectively measured by whether the API contracts are satisfied
4. **Consistent Comparison**: Different implementations can be fairly compared since they must all pass the same API tests

### Measuring Agentic Coding Performance

The API tests serve as an executable specification. When an AI agent is tasked with implementing features:

- The tests define **what** the system should do
- The agent decides **how** to implement it
- Efficiency metrics capture implementation cost (tokens, time, iterations)

## Design Decisions

### No TDD Requirement

This project intentionally does not enforce Test-Driven Development (TDD) as a methodology. Tests are provided as an executable specification for measuring implementation efficiency. The agent is free to implement features in whatever order it finds most effective. The focus is on measuring the end result (passing tests, clean code) rather than prescribing a specific development workflow.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **REST Framework:** Fastify
- **Testing:** Vitest
- **Code Quality:** Biome (linting & formatting), ls-lint (file naming), knip (unused deps)

## Getting Started

```bash
npm install
npm run build
npm test
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm start` | Run the compiled server |
| `npm run dev` | Run in development mode |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint source files |
| `npm run format` | Auto-format source files |
| `npm run verify` | Run all checks (format, lint, build, test) |

## API Endpoints

### Health Check
- `GET /health` - Service health status
