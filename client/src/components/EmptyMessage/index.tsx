import { Button, Stack, Typography } from "@mui/material";

import React from "react";
import { useNavigate } from "react-router-dom";

type EmptyMessageProps = {
  primaryText: string;
  secondaryText?: string;
  buttonText?: string;
  navigateTo?: string;
};

const EmptyMessage = React.memo(
  ({
    primaryText,
    secondaryText,
    buttonText,
    navigateTo,
  }: EmptyMessageProps) => {
    const navigate = useNavigate();
    return (
      <Stack
        sx={{
          height: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ textAlign: "center" }}>
          {primaryText}
        </Typography>
        {secondaryText && (
          <Typography
            variant="body1"
            color="textSecondary"
            gutterBottom
            sx={{ textAlign: "center", fontSize: "0.9rem" }}
          >
            {secondaryText}
          </Typography>
        )}
        {buttonText && navigateTo && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-light)",
              mt: 3,
              height: "30px",
            }}
            onClick={() => navigate(navigateTo)}
          >
            {buttonText}
          </Button>
        )}
      </Stack>
    );
  }
);
EmptyMessage.displayName = "EmptyMessage";

export default EmptyMessage;
