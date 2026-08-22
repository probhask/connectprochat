import { Cancel, DoneTwoTone } from "@mui/icons-material";
import { ErrorState, LoadingState } from "@components/FetchingStates";

import ActionProfilePreview from "@components/ActionProfilePreview";
import EmptyMessage from "@components/EmptyMessage";
import { Stack } from "@mui/material";
import useFriendRequestContext from "@context/FriendRequestContext";

const ReceiveRequest = () => {
  const {
    receivedRequests: req,
    receivedLoading,
    receivedError,
    cancelLoading,
    handleCancelRequest,
    cancelRequestId,
    handleAcceptRequest,
    acceptLoading,
    acceptRequestId,
  } = useFriendRequestContext();

  return (
    <Stack
      direction="column"
      className="hide-scrollbar"
      sx={{
        overflowY: "auto",
      }}
    >
      {!receivedError &&
        req &&
        req?.length > 0 &&
        req?.map(({ _id, sender }) => {
          const { _id: senderId, profile_picture, username } = sender;
          const acceptingRequest = acceptLoading && acceptRequestId === _id;

          const cancelingRequest = cancelLoading && cancelRequestId === _id;
          if (senderId) {
            return (
              <ActionProfilePreview
                key={_id}
                userId={senderId}
                imageSrc={
                  profile_picture?.fileName ? profile_picture?.fileName : ""
                }
                username={username}
                buttons={[
                  {
                    text: cancelingRequest ? "..." : "REJECT",
                    themeColor: "#C62E2E",
                    icon: cancelingRequest ? (
                      ""
                    ) : (
                      <Cancel sx={{ width: "15px", height: "auto" }} />
                    ),
                    handleClick: () => handleCancelRequest(_id, "RECEIVE"),
                  },
                  {
                    text: acceptingRequest ? "..." : "Accept",
                    themeColor: "#347928",
                    icon: acceptingRequest ? (
                      ""
                    ) : (
                      <DoneTwoTone sx={{ width: "15px", height: "auto" }} />
                    ),
                    handleClick: () => handleAcceptRequest(_id),
                  },
                ]}
              />
            );
          }
        })}

      {!receivedError && !receivedLoading && req?.length === 0 && (
        <EmptyMessage
          primaryText="No received friend request"
          secondaryText="You haven't received any friend requests. Let your friends know you're here!"
        />
      )}

      {receivedLoading && <LoadingState message="loading receive request" />}
      {!receivedLoading && receivedError && (
        <ErrorState error={"unable to fetch data"} />
      )}
    </Stack>
  );
};

export default ReceiveRequest;
