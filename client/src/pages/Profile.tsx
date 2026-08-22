import { Box, Stack } from "@mui/material";

import { Outlet } from "react-router-dom";
import { ProfileContextProvider } from "@context/ProfileContext";
import bgImage from "@assets/images/auth/bg_1280.jpg";

const Profile = () => {
  return (
    <ProfileContextProvider>
      <Box
        sx={{
          width: "100%",
          position: "relative",
          color: "var(--color-light)",
        }}
      >
        <Box
          component={"img"}
          src={bgImage}
          sx={{
            position: "Fixed",
            zIndex: -1,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            objectFit: "cover",
            width: "100%",
            height: "100vh",
          }}
        />
        <Box
          sx={{
            bgcolor: "var(--color-bg-overlay)",
            width: "100%",
            minHeight: "100Vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            overflowY: "auto",
            paddingBlock: 5,
            paddingInline: "10px",
          }}
        >
          <Stack
            sx={{
              justifyContent: "center",
              padding: "20px 20px",
              // bgcolor: "var(--color-light)",
              backgroundColor: "rgba(0,0,0,0.8)",
              boxShadow: "0 0 4px rgba(255,255,255,0.4)",
              minHeight: "300px",
              color: "var(--color-light)",
              borderRadius: "20px",
              // width: { xs: 300, sm: 400 },
              minWidth: { xs: "90%", sm: 300 },
              maxWidth: "500px",
              width: "99%",
            }}
          >
            <Outlet />
          </Stack>
        </Box>
      </Box>
    </ProfileContextProvider>
  );
};

export default Profile;
