import { Grid2, ListItemText, Typography } from "@mui/material";

import React from "react";

type ChatListItemTextProps = {
  primaryText: string;
  secondaryText: string;
};

const ChatListItemText = React.memo(
  ({ primaryText, secondaryText }: ChatListItemTextProps) => {
    return (
      <ListItemText
        primary={
          <Grid2
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: "3px",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "0.9rem", fontWeight: "700" }}
            >
              {primaryText}
            </Typography>
          </Grid2>
        }
        secondary={
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              textOverflow: "clip",
              lineClamp: 1,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
          >
            {secondaryText}
          </Typography>
        }
      />
    );
  }
);
ChatListItemText.displayName = "ChatListItemText";
export default ChatListItemText;
