import { ErrorState, LoadingState } from "@components/FetchingStates";
import { Message, PersonRemove } from "@mui/icons-material";

import ActionProfilePreview from "@components/ActionProfilePreview";
import EmptyMessage from "@components/EmptyMessage";
import { Stack } from "@mui/material";
import useFriendContext from "@context/FriendContext";

const FriendsListPage = () => {
  const {
    //fetch  friends
    friends: friendsList,
    friendError,
    friendLoading,
    //unfriend
    unfriendLoading,
    handleUnfriendUser,
    removeFriendId,
    //enter conversation user
    conversationRoomLoading,
    conversationFriendId,
    handleFindConversationRoom,
  } = useFriendContext();

  return (
    <Stack
      direction="column"
      className="hide-scrollbar"
      sx={{
        overflowY: "auto",
        justifyContent: "center",
      }}
    >
      {!friendError &&
        friendsList.length > 0 &&
        friendsList.map(({ _id, profile_picture, username, isOnline }) => {
          const unfriending = unfriendLoading && removeFriendId === _id;
          const findingConversation =
            conversationRoomLoading && conversationFriendId === _id;

          return (
            <ActionProfilePreview
              key={_id}
              isOnline={isOnline}
              userId={_id}
              imageSrc={
                profile_picture?.fileName ? profile_picture?.fileName : ""
              }
              username={username}
              buttons={[
                {
                  text: findingConversation ? "..." : "Message",
                  themeColor: "var(--color-bg-primary)",
                  icon: findingConversation ? (
                    ""
                  ) : (
                    <Message sx={{ width: "15px", height: "auto" }} />
                  ),
                  handleClick: () => handleFindConversationRoom(_id),
                },
                {
                  text: unfriending ? "..." : "Unfriend",
                  themeColor: "var(--color-danger)",
                  icon: unfriending ? (
                    ""
                  ) : (
                    <PersonRemove sx={{ width: "15px", height: "auto" }} />
                  ),
                  handleClick: () => handleUnfriendUser(_id),
                  disable: unfriending,
                },
              ]}
            />
          );
        })}

      {!friendError && !friendLoading && friendsList.length === 0 && (
        <EmptyMessage
          primaryText="You have no friends yet"
          secondaryText="Start connecting with others or find new friends!"
          buttonText="Find Friends"
          navigateTo="/explore"
        />
      )}
      {friendLoading && <LoadingState message="loading friends" />}
      {!friendLoading && friendError && (
        <ErrorState error={"unable to fetch data"} />
      )}
    </Stack>
  );
};

export default FriendsListPage;
