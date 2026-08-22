import { Box, Stack, styled } from "@mui/material";

import ConversationPage from "./ConversationPage";
import { FriendContextProvider } from "@context/FriendContext";
import { FriendRequestContextProvider } from "@context/FriendRequestContext";
import LeftSideTopBar from "@components/LeftSideTopBar";
import { Outlet } from "react-router-dom";
import SideProfile from "@features/SideProfile";
import useChatAppContext from "@context/index";

const ChatPage = () => {
  const { conversationTab, profileTab } = useChatAppContext();

  return (
    <FriendContextProvider>
      <FriendRequestContextProvider>
        <Stack direction="row" sx={{ spacing: { xs: 0, sm: 2 } }}>
          <LeftSideBar screen={(conversationTab || profileTab).toString()}>
            <LeftSideTopBar />
            <Box
              sx={{
                height: "calc(100vh - 90px)",
                overflow: "auto",
                backgroundColor: "var(--color-light)",
              }}
            >
              <Outlet />
            </Box>
          </LeftSideBar>

          {/* chat room */}
          <ChatRoom
            screen={conversationTab.toString()}
            other={profileTab.toString()}
          >
            <ConversationPage />
          </ChatRoom>

          {/* profile info */}
          <RightSideBar
            screen={profileTab.toString()}
            other={conversationTab.toString()}
          >
            <SideProfile />
          </RightSideBar>
        </Stack>
      </FriendRequestContextProvider>
    </FriendContextProvider>
  );
};

export default ChatPage;

const LeftSideBar = styled(Box)<{
  screen: string;
}>(({ theme, screen }) => ({
  flex: 1,
  backgroundColor: "var(--color-light)",
  display: screen === "false" ? "block" : "none",
  height: "100vh",
  overflow: "hidden",
  position: "relative",
  [theme.breakpoints.up("sm")]: {
    minWidth: "200px",
    display: "block",
  },
  [theme.breakpoints.down("sm")]: {
    display: screen === "false" ? "block" : "none",
  },
}));
LeftSideBar.displayName = "LeftSideBar";

const ChatRoom = styled(Box)<{
  screen: string;
  other?: string;
}>(({ theme, screen, other }) => ({
  flex: 1.5,
  display: screen === "true" ? "block" : "none",

  [theme.breakpoints.up("sm")]: {
    borderLeft: "2px solid var(--color-light-gray)",
    display:
      (screen === "false" && other === "false") || screen === "true"
        ? "block"
        : "none",
  },
  [theme.breakpoints.up("md")]: {
    borderInline: "2px solid var(--color-light-gray)",
    display: "block",
    flex: 2,
  },
}));
ChatRoom.displayName = "ChatRoom";

const RightSideBar = styled(Box)<{
  screen: string;
  other?: string;
}>(({ theme, screen }) => ({
  flex: 1,
  display: screen === "true" ? "block" : "none",
  [theme.breakpoints.up("sm")]: {
    borderLeft: "2px solid var(--color-light-gray)",
    flex: 1.5,
  },
  [theme.breakpoints.up("md")]: {
    display: "block",
    flex: 1,
  },
}));
RightSideBar.displayName = "RightSideBar";
