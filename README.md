# VDMLearn — DVM Reviewer

Local-first study app for Philippine DVM students and VMLE (Veterinary Licensure Exam) board exam preparation. No AI API calls in the app; questions are generated offline and imported via JSON.

## Prerequisites

- **Node.js >=22.22.0** (`nvm use` — see `.nvmrc`)
- **Quasar CLI**: `npm install -g @quasar/cli`

## Setup

```bash
npm install
```

## Commands

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `quasar dev`         | Dev server at http://localhost:9000 |
| `npm run build`      | Production SPA → `dist/spa/`        |
| `npm test`           | Run all unit/integration tests      |
| `npm run typecheck`  | TypeScript check (vue-tsc)          |
| `npm run lint`       | Fix lint + format                   |
| `npm run lint:check` | Lint check only (no write)          |

## Importing questions

1. Generate questions using the prompt in `docs/generate-questions-prompt.md`
2. Go to **Import** tab in the app (upload icon in the header)
3. Paste or upload the JSON; all questions are saved as `unverified`

See [VDMLearn.md](VDMLearn.md) for the full system overview, folder structure, and feature documentation.
