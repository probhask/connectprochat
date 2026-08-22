import { ErrorState, LoadingState } from "@components/FetchingStates";

import ActionProfilePreview from "@components/ActionProfilePreview";
import { Add } from "@mui/icons-material";
import EmptyMessage from "@components/EmptyMessage";
import { Stack } from "@mui/material";
import { useChatAppSelector } from "@store/hooks";
import useExplore from "@hooks/useExplore";

const Explore = () => {
  const users = useChatAppSelector((store) => store.exploreUsers);

  const {
    exploreLoading,
    exploreError,
    sendFriendRequest,
    sendRequestLoading,
    friendRequestReceiver,
  } = useExplore();

  return (
    <Stack
      direction="column"
      sx={{
        overflowY: "auto",
      }}
    >
      {!exploreError &&
        users &&
        users.length > 0 &&
        users.map(({ _id, profile_picture, username }) => {
          const sendingRequest =
            sendRequestLoading && friendRequestReceiver === _id;
          return (
            <ActionProfilePreview
              key={_id}
              userId={_id}
              username={username}
              imageSrc={
                profile_picture?.fileName ? profile_picture?.fileName : ""
              }
              buttons={[
                {
                  text: sendingRequest ? "..." : "ADD",
                  themeColor: "#6256CA",
                  icon: sendingRequest ? (
                    ""
                  ) : (
                    <Add sx={{ width: "15px", height: "auto" }} />
                  ),
                  handleClick: () => sendFriendRequest(_id),
                  disable: sendRequestLoading && sendingRequest,
                },
              ]}
            />
          );
        })}
      {!exploreLoading && !exploreError && users.length === 0 && (
        <EmptyMessage primaryText="No User " />
      )}
      {exploreLoading && <LoadingState />}
      {!exploreLoading && exploreError && (
        <ErrorState error={"unable to load data"} />
      )}
    </Stack>
  );
};

export default Explore;
