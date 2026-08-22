import { createTheme } from "@mui/material";

import { colorTokens } from "./tokens";

/**
 * MUI runs fully unthemed today — no createTheme()/ThemeProvider existed
 * anywhere in the app before this, so every MUI component used MUI's stock
 * default palette regardless of tokens.css.
 *
 * Deliberately NOT overriding `background`/`text` here (a first attempt did,
 * and it broke the app visually — see the fix note below). Only `primary`
 * (the accent color, used consistently for buttons/links/highlights) and
 * the semantic status colors are safe to apply globally; they're designed
 * to be used as small, high-contrast accents against whatever surface
 * they're on. `background.default`/`text.primary`, by contrast,
 * `CssBaseline` applies as the DEFAULT color for the entire app body —
 * `--color-text-primary` (#ffe1ff, a light pink meant for text on the dark
 * purple auth-page background) ended up as the default text color on every
 * white/light surface too (chat list, forms, cards), which is what made
 * the app look broken after Phase 4 landed. Individual screens that
 * genuinely want the dark-purple-background look (like the auth pages)
 * set that locally via `sx`/styled — same as they did before this theme
 * existed — rather than it cascading globally through the theme.
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colorTokens.accentPrimary,
    },
    error: {
      main: colorTokens.danger,
    },
    success: {
      main: colorTokens.success,
    },
    warning: {
      main: colorTokens.warning,
    },
    divider: colorTokens.border,
  },
});
