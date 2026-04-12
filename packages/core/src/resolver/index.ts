export type Variables = Record<string, string | undefined>;

/**
 * Resolves template variables in a clause body using dot-notation.
 * Variables are resolved in order of priority (highest wins):
 * 1. Project-level variables
 * 2. Practice-level variables
 * 3. Empty string (fallback - never throws)
 *
 * @param body - Clause body with {{variable}} tokens
 * @param projectVars - Project-level variable overrides
 * @param practiceVars - Practice-level default variables
 * @returns Resolved clause body with variables substituted
 */
export function resolveClause(body: string, projectVars: Variables, practiceVars: Variables): string {
  if (!body || typeof body !== 'string') {
    return '';
  }

  return body.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => {
    // Priority: project > practice > empty string
    const value = projectVars[key] ?? practiceVars[key] ?? '';
    return value;
  });
}

/**
 * Extracts all variable tokens from a clause body
 *
 * @param body - Clause body with {{variable}} tokens
 * @returns Array of variable names found in the body
 */
export function extractVariables(body: string): string[] {
  if (!body || typeof body !== 'string') {
    return [];
  }

  const matches = body.match(/\{\{([\w.]+)\}\}/g);
  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(2, -2)); // Remove {{ and }}
}
