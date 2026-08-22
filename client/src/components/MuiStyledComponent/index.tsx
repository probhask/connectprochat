import { Avatar, Button, styled } from "@mui/material";

export const StyledUserAvatar = styled(Avatar)<{
  live?: string;
  width?: number | string;
  height?: string | number;
  border?: string;
  backcolor?: string;
}>(({ live, height, width, border, backcolor }) => ({
  width: width ? width : 40,
  height: height ? height : 40,
  border:
    live === "true"
      ? "2px solid var(--color-success)"
      : border
      ? `2px solid ${border}`
      : "none",
  backgroundColor: backcolor ? backcolor : "var(--color-border)",
}));

export const StyledActionButton = styled(Button)<{ pallet?: string }>(
  ({ theme, pallet = "var(--color-success)" }) => ({
    width: "90vw",
    maxWidth: "250px",
    height: 25,
    fontsize: "0.7rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 1.9,
    border: `1px solid ${pallet}`,
    bgcolor: "inherit",
    color: `${pallet}`,
    alignSelf: "center",
    ":hover": {
      backgroundColor: `${pallet}`,
      color: "var(--color-light)",
    },
    ":disabled": {
      backgroundColor: "var(--color-border)",
      borderColor: "var(--color-border)",
      color: "var(--color-light)",
      fontWeight: 900,
      fontSize: "1.3rem",
    },
    [theme.breakpoints.up("sm")]: {
      width: "auto",
      height: 28,
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "0.9rem",
    },
  })
);
