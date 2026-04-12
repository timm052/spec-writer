// Lazy-loads practice vars on the client via the API rather than a JSON import
// (JSON imports in client bundles would expose the file path at build time)
export const practiceVarsPromise: Promise<Record<string, string>> = fetch('/api/practice-vars')
  .then((r) => r.json() as Promise<Record<string, string>>)
  .catch(() => ({}));
