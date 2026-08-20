/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Maps every Tailwind color utility to the tokens defined once in
      // src/theme/tokens.css — `bg-bg-primary`, `text-accent`, etc. resolve
      // to the same values MUI and raw CSS use. See revamp plan Section B.
      colors: {
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-overlay": "var(--color-bg-overlay)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        accent: "var(--color-accent-primary)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        border: "var(--color-border)",
      },
    },
  },
  plugins: [],
};
