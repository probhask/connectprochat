import { createTheme } from "@mui/material";

import { colorTokens } from "./tokens";

/**
 * MUI runs fully unthemed today — no createTheme()/ThemeProvider exists
 * anywhere in the app, so every MUI component (Button, Dialog, etc.) uses
 * MUI's stock default palette regardless of tokens.css. This is the first
 * theme MUI has ever had here.
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colorTokens.accentPrimary,
    },
    background: {
      default: colorTokens.bgPrimary,
      paper: colorTokens.bgSurface,
    },
    text: {
      primary: colorTokens.textPrimary,
      secondary: colorTokens.textSecondary,
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
