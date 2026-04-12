# SpecWriter — Core Engine

Variable resolver and spec engine with full test coverage.

## Exports

- `resolveClause()` — Substitute `{{variable}}` tokens with values
- `extractVariables()` — Extract all variable tokens from text
- `specEngine.buildSpec()` — Build complete resolved specification
- `specEngine.filterIncludedClauses()` — Filter clauses by inclusion status
- `specEngine.mergeWithOverrides()` — Merge base clauses with project overrides

## Tests

```bash
pnpm test
```

All functions in this package must maintain 90%+ code coverage.
