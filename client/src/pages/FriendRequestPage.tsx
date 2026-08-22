import { Box, Button, Stack, styled } from "@mui/material";

import ReceiveRequest from "@features/FriendRequest/ReceiveRequest/ReceiveRequest";
import SendRequest from "@features/FriendRequest/SendRequest/SendRequest";
import { useChatAppSelector } from "@store/hooks";
import { useEffect } from "react";
import useFriendRequestContext from "@context/FriendRequestContext";

const FriendRequestPage = () => {
  // Consume the shared instance from FriendRequestContextProvider (mounted
  // in ChatPage) rather than calling useFriendRequest() directly here —
  // a second, independent hook instance would fetch data but leave the
  // sentLoading/receivedLoading/error state read by SendRequest/
  // ReceiveRequest (which read the context's instance) permanently stale.
  const { tab, changeTab, handleFetchReceivedRequest, handleFetchSentRequest } =
    useFriendRequestContext();
  const { received, sended } = useChatAppSelector(
    (store) => store.friendRequest
  );

  useEffect(() => {
    async function handleFunction() {
      if (tab === "sent") {
        await handleFetchSentRequest();
      } else if (tab === "received") {
        await handleFetchReceivedRequest();
      }
    }
    handleFunction();
  }, [tab]);

  return (
    <Box sx={{ paddingBlock: 1.5, overflowY: "auto" }}>
      <Stack
        flexDirection="row"
        sx={{ width: "100%", justifyContent: "center", mb: 1.5 }}
      >
        <TabButton
          active={tab === "sent" ? "true" : ""}
          onClick={() => changeTab("sent")}
        >
          Sent
          {sended?.length > 0 && <CountBadge>{sended.length}</CountBadge>}
        </TabButton>
        <TabButton
          active={tab === "received" ? "true" : ""}
          onClick={() => changeTab("received")}
        >
          Received
          {received?.length > 0 && <CountBadge>{received.length}</CountBadge>}
        </TabButton>
      </Stack>

      {tab === "sent" ? <SendRequest /> : <ReceiveRequest />}
    </Box>
  );
};

export default FriendRequestPage;

const TabButton = styled(Button)<{ active: string }>(({ active }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  backgroundColor: active === "true" ? "var(--color-bg-primary)" : "white",
  color: active === "true" ? "white" : "black",
  boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
  height: "30px",
  marginInline: 9,
  // width: "80px",
  width: "100%",
  ":hover": {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    scale: 1.03,
  },
}));
const CountBadge = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "absolute",
  top: -7,
  right: -5,
  width: 20,
  height: 20,
  p: 0,
  m: 0,
  borderRadius: "50%",
  backgroundColor: "var(--color-red)",
  color: "white",
}));
