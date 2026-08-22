import { Box, Button, Stack, Typography, styled } from "@mui/material";
import { ContactMail, Key, Logout, NoPhotography } from "@mui/icons-material";

import UserProfilePic from "./UserProfilePic";
import useAuthentication from "@hooks/useAuthentication";
import { useChatAppSelector } from "@store/hooks";
import { useNavigate } from "react-router-dom";
import useProfileContext from "@context/ProfileContext";

const UserData = () => {
  const user = useChatAppSelector((store) => store.auth);
  const { handleRemoveProfilePic, removePicLoading } = useProfileContext();
  const navigate = useNavigate();
  const { handleLogoutUser, logoutLoading } = useAuthentication();

  return (
    <Stack
      sx={{
        alignItems: "center",
      }}
    >
      {/* user image */}
      <UserProfilePic />
      {/* name and email */}
      <Box sx={{ marginTop: 1, marginBottom: 6 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            textOverflow: "clip",
            lineClamp: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            textWrap: "wrap",
          }}
        >
          {user?.username}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            wordWrap: "break-word",
            textOverflow: "clip",
            lineClamp: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {user?.email}
        </Typography>
      </Box>

      {/* action buttons */}
      <Stack
        sx={{
          rowGap: 2,
        }}
      >
        <StyledButton
          bgcolor="var(--color-danger)"
          onClick={handleRemoveProfilePic}
          disabled={removePicLoading}
        >
          <NoPhotography /> Remove Picture
        </StyledButton>
        <StyledButton
          bgcolor="var(--color-success)"
          onClick={() => navigate("update-personal")}
        >
          <ContactMail /> Update Account Details
        </StyledButton>

        <StyledButton
          bgcolor="var(--color-warning)"
          onClick={() => navigate("update-password")}
        >
          <Key /> Change Password
        </StyledButton>
        <StyledButton
          bgcolor="var(--color-danger)"
          onClick={handleLogoutUser}
          disabled={logoutLoading}
        >
          <Logout /> {logoutLoading ? "logging out..." : "Logout"}
        </StyledButton>
      </Stack>
    </Stack>
  );
};
UserData.displayName = "UserData";
export default UserData;

const StyledButton = styled(Button)<{ bgcolor?: string }>(
  ({ bgcolor = "var(--color-bg-primary)" }) => ({
    backgroundColor: bgcolor,
    color: "var(--color-light)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 4,
    // boxShadow: `0 0 4px ${bgcolor}`,
    border: bgcolor,
  })
);
