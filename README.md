# SpecWriter

Specification authoring tool for architectural practice. Replaces manual NatSpec clause management in Word documents with a structured, version-controlled web application.

## Features

- **Library browser** — browse and search the NatSpec clause library by section
- **Project specs** — compose per-project specifications by selecting and overriding clauses
- **Variable tokens** — `{{project.name}}` style tokens resolved at export time; rendered as non-editable chips in the editor
- **Rich text editor** — TipTap-powered clause editor with variable autocomplete
- **Per-project section ordering** — drag sections into project-specific order without affecting the library
- **Spec snapshots** — snapshot the resolved spec at issue time for revision history
- **PDF / DOCX / JSON export** — pixel-perfect PDF via headless Chrome; DOCX via docx.js
- **Auth** — NextAuth v5 magic-link email sign-in; all API routes protected

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS · TipTap |
| Auth | NextAuth v5 · Nodemailer · DrizzleAdapter |
| Database | PostgreSQL 16 · Drizzle ORM |
| Monorepo | Turborepo · pnpm workspaces |
| PDF | Puppeteer (headless Chrome) |
| DOCX | docx.js |
| Testing | Vitest · React Testing Library · testcontainers |
| Build | tsup (ESM + CJS dual output) |

## Project structure

```
spec-writer/
├── apps/
│   └── web/                     # Next.js 15 app
│       ├── app/api/             # Route handlers (auth-gated via middleware)
│       ├── components/          # React components
│       └── lib/                 # Shared utilities
├── packages/
│   ├── core/                    # Variable resolver + spec engine
│   ├── db/                      # Drizzle schema · migrations · queries
│   └── export/                  # PDF · DOCX · HTML · JSON exporters
├── docker-compose.yml           # PostgreSQL + Mailpit (local dev)
└── turbo.json                   # Turborepo pipeline
```

## Getting started

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Build internal packages (core, db, export)
pnpm build

# Start local PostgreSQL and Mailpit
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed with NatSpec clauses
pnpm db:seed

# Copy env file and fill in values
cp apps/web/.env.local.example apps/web/.env.local

# Start dev server
pnpm dev
```

The app runs at `http://localhost:3000`. Sign in via the magic-link email flow — Mailpit catches outgoing emails at `http://localhost:8025`.

### Environment variables

See [apps/web/.env.local.example](apps/web/.env.local.example) for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session signing |
| `NEXTAUTH_URL` | Public URL of the app |
| `EMAIL_SERVER_HOST` | SMTP host (use `localhost` + Mailpit locally) |
| `EMAIL_SERVER_PORT` | SMTP port (default `1025` for Mailpit) |
| `EMAIL_FROM` | From address for magic-link emails |

## Development

```bash
# Run all tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build all packages
pnpm build
```

### DB integration tests (requires Docker)

```bash
cd packages/db
pnpm test:integration
```

Spins up a real Postgres container via testcontainers, runs migrations, and exercises all Drizzle queries end-to-end.

## Packages

### `@spec-writer/core`

Pure functions — no side effects, no I/O.

- `resolveClause(body, projectVars, practiceVars)` — substitute `{{key}}` tokens
- `extractVariables(body)` — list all token keys in a clause body
- `specEngine.buildSpec()` — generate a complete resolved specification

### `@spec-writer/db`

Drizzle ORM schema and query functions.

Tables: `sections` · `clauses` · `projects` · `project_clauses` · `project_sections` · `spec_snapshots` · `users` · `accounts` · `sessions`

### `@spec-writer/export`

Exporters that consume a resolved `BuiltSpec`.

- `buildSpecPdf(project, sections)` — PDF via Puppeteer
- `buildSpecDocx(project, sections)` — DOCX via docx.js
- `buildSpecHtml(project, sections)` — print-ready HTML
- `buildSpecJson(project, sections)` — structured JSON

## API routes

All routes require an authenticated session (enforced by `apps/web/middleware.ts`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |
| GET | `/api/projects/[id]/spec` | Get resolved spec |
| PATCH | `/api/projects/[id]/sections/[sid]` | Update section sort order |
| GET | `/api/projects/[id]/snapshots` | List spec snapshots |
| POST | `/api/projects/[id]/snapshots` | Create snapshot |
| GET | `/api/projects/[id]/snapshots/[snapId]` | Get snapshot |
| GET | `/api/projects/[id]/export/pdf` | Download PDF |
| GET | `/api/projects/[id]/export/docx` | Download DOCX |
| GET | `/api/sections` | List library sections |
| GET | `/api/clauses` | Search clauses |

## Database migrations

Migrations live in `packages/db/migrations/`. Run them with:

```bash
pnpm db:migrate
```

| File | Description |
|------|-------------|
| `0001_initial.sql` | Base schema (sections, clauses, projects, project_clauses, auth tables) |
| `0002_materials.sql` | Materials library |
| `0003_project_sections.sql` | Per-project section ordering |
| `0004_spec_snapshots.sql` | Spec snapshot history |
