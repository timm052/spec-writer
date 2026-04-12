# SpecWriter — Database Layer

## Scripts

```bash
# Run database migrations
pnpm db:migrate

# Seed database with 50 NatSpec clauses
pnpm db:seed
```

## Schema

- `sections` — NatSpec section hierarchy
- `clauses` — Specification clauses with variable tokens
- `projects` — Project records with variable overrides
- `project_clauses` — Join table with sort order and overrides
- `materials` — Shared material/product library
