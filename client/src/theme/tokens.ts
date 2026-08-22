/**
 * Literal-value mirror of tokens.css's light palette, for muiTheme.ts only.
 *
 * MUI v6 doesn't have v7's `cssVariables: true` theming — its internal
 * color utilities (alpha(), lighten(), darken(), which MUI components use
 * throughout for hover/focus/disabled states) need to *parse* a real color,
 * so a raw `"var(--color-x)"` string in the palette breaks them. Until a
 * deliberate MUI v7 upgrade lands (tracked in the revamp plan's package
 * audit), this is the pragmatic fix: the same values declared in two
 * places, kept in sync by convention, not by tooling. If you change a
 * color, change it in both tokens.css and here.
 *
 * Only the light palette is mirrored — MUI's ThemeProvider doesn't switch
 * with prefers-color-scheme/.dark on its own; wiring MUI to the dark
 * tokens too is Phase 5 scope once the app has an actual theme-mode toggle
 * to drive it.
 */
export const colorTokens = {
  bgPrimary: "#433878",
  bgSecondary: "#ffffff",
  bgSurface: "#ffffff",
  textPrimary: "#ffe1ff",
  textSecondary: "#555555",
  accentPrimary: "#e4b1f0",
  danger: "#c62e2e",
  success: "#347928",
  warning: "#ffa000",
  border: "#d1d5db",
} as const;
