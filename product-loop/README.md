# Helia Product Loop (4 agents)

Durable **eve** multi-agent system. The consumer Helia app is **blocked** until User, Product Manager, Coder, and QA all approve V1.

```
User feedback → PM roadmap → Coder build → QA checks → User acceptance
        ↑__________________________________________________|
                         (loop until gate opens)
```

## Agents

| Role | Subagent | Responsibility |
|------|----------|----------------|
| User | `user` | Feedback + final acceptance |
| Product Manager | `product_manager` | V1 roadmap / cuts |
| Coder | `coder` | Implement roadmap slices |
| QA | `qa` | Verify + block ship on defects |
| Orchestrator | root Helia Loop | Runs the cycle, owns the gate |

## Requirements

- **Node.js 24+** (eve requirement)
- Model credentials via `eve` login / AI Gateway

```bash
# if needed
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"

cd product-loop
npm install
npm run typecheck
npm run dev          # interactive REPL
# or
npm exec -- eve dev --no-ui
```

## Start the loop

In the REPL, say:

> Start the Helia V1 product loop. User feedback is already in workspace/artifacts/01-user-feedback.md. Run PM → Coder → QA → User acceptance. Do not open the app-creation gate until all four signoffs are approved.

## Artifacts

Written under `workspace/artifacts/`:

- `01-user-feedback.md`
- `02-roadmap.md`
- `03-build-notes-iter-N.md`
- `04-qa-report-iter-N.md`

Gate file: `workspace/v1-status.json` (`gate_open: true` only when all roles approved).

## After the gate opens

Only then create/ship the consumer Helia mobile app (or promote the prototype in the monorepo root) as Version 1.
