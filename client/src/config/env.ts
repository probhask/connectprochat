/**
 * Centralizes `import.meta.env.VITE_*` reads (previously scattered across
 * `Api/index.tsx`, `SocketContext.tsx`, etc. — see revamp plan Section B).
 * Import `env` everywhere instead of touching `import.meta.env` directly.
 */
function requireEnvVar(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  BACKEND_URL: requireEnvVar(
    "VITE_BACKEND_URL",
    import.meta.env.VITE_BACKEND_URL
  ),
} as const;
