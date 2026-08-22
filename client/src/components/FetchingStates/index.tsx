import { Box, Stack, Typography } from "@mui/material";

import { AiOutlineLoading } from "react-icons/ai";
import { Error } from "@mui/icons-material";
import React from "react";

export const EmptyData = React.memo(
  ({ message = "Not data" }: { message: React.ReactNode }) => {
    return (
      <Typography
        sx={{
          textAlign: "center",
          paddingBlock: "20px",
          width: "100%",
          color: " var(--color-bg-primary)",
          fontSize: "1.1rem",
          height: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {message}
      </Typography>
    );
  }
);

export const LoadingState = React.memo(
  ({ message = "loading" }: { message?: string }) => {
    return (
      <Stack
        sx={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          columnGap: "10px",
          color: " var(--color-bg-primary)",
          height: "70vh",
        }}
      >
        <AiOutlineLoading className="size-5 animate-spin duration-1000 ease-in text-inherit" />
        {/* < sx={{ width: "1.3rem", height: "auto", mr: 1 }} /> */}

        <Typography
          sx={{
            textAlign: "center",
            paddingBlock: "20px",
            // color: " #404040",
            fontSize: "1rem",
            color: "inherit",
          }}
        >
          {message}...
        </Typography>
      </Stack>
    );
  }
);

export const ErrorState = React.memo(
  ({ error = "error..." }: { error?: string }) => {
    return (
      <Box
        sx={{
          textAlign: "center",
          paddingBlock: "40px",
          width: "100%",
          color: " var(--color-danger)",
          fontSize: "0.95rem",
          height: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Error sx={{ width: "1.3rem", height: "auto", mr: 1 }} />
        <Typography> {error}</Typography>
      </Box>
    );
  }
);
