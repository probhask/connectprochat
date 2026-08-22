import { Box, Stack, Typography } from "@mui/material";

import ProfileAvatar from "@components/ProfileAvatar";
import React from "react";

type UserInfoProps = {
  url: string;
  name: string;
  additionalText: string;
};

const UserInfo = React.memo(({ additionalText, name, url }: UserInfoProps) => {
  return (
    <Stack
      sx={{
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        rowGap: 2,
        p: 2,
        position: "sticky",
        bgcolor: "inherit",
        zIndex: 2,
        top: 0,
        borderBottom: "3px solid var(--color-light-gray)",
        // boxShadow: "2px 0px 2px rgba(0,0,0,0.2)",
      }}
    >
      <ProfileAvatar
        url={url || ""}
        sx={{
          width: "120px",
          height: "120px",
          background: "var(--color-border)",
          border: "2px solid var(--color-bg-secondary)",
          boxShadow: "0px 0px 6px var(--color-bg-secondary)",
        }}
      />
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, m: 0, p: 0 }}>
          {name}
        </Typography>
        <Typography>{additionalText}</Typography>
      </Box>
    </Stack>
  );
});
UserInfo.displayName = "UserInfo";

export default UserInfo;
