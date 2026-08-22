import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { IconButton, Stack, TextField, Tooltip, styled } from "@mui/material";

import { DOC_PREVIEW } from "types";
import { EmojiEmotions } from "@mui/icons-material";
import { FormikErrors } from "formik";
import MediaPreview from "./MediaPreview";
import React from "react";

type MessageInputProps = {
  value: string;
  onchange:
    | React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined;
  imagePreview: string | null;
  resetImagePreview: () => void;
  resetDocPreview: () => void;
  docPreview: DOC_PREVIEW | null;

  showEmoji: boolean;
  toggleEmoji: () => void;
  setValues: (
    values: React.SetStateAction<{
      msg: string;
    }>,
    shouldValidate?: boolean
  ) => Promise<void | FormikErrors<{
    msg: string;
  }>>;
};

const MessageInput = React.memo(
  ({
    value,
    onchange,
    docPreview,
    imagePreview,
    resetDocPreview,
    resetImagePreview,
    setValues,
    showEmoji,
    toggleEmoji,
  }: MessageInputProps) => {
    const handleEmojiClick = ({ emoji }: EmojiClickData) => {
      setValues((prev) => {
        prev.msg = prev.msg + emoji;
        // setShowEmoji(false);
        return prev;
      });
    };
    return (
      <Stack
        flexDirection="column"
        flex={1}
        sx={{
          flex: 1,
          flexDirection: "column",
          backgroundColor: "var(--color-light)",
          borderRadius: 2,
        }}
      >
        {/* file preview */}
        <MediaPreview
          docPreview={docPreview}
          resetDocPreview={resetDocPreview}
          imagePreview={imagePreview}
          resetImagePreview={resetImagePreview}
        />

        <Stack
          sx={{
            flexDirection: "row",
            flex: 1,
            paddingLeft: 1,
            position: "relative",
          }}
        >
          {/* msg input */}
          <StyledInput
            placeholder="Message..."
            multiline
            autoFocus={true}
            name="msg"
            value={value}
            // rows={1}
            maxRows={5}
            fullWidth
            onChange={onchange}
            InputProps={{
              sx: {
                // p: 0,
                // padding: 0,
                border: "none",
                "& textarea": {
                  border: "none",
                },
              },
            }}
            sx={{
              p: 0,
              width: "100%",
              // height: "40px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "0px",
                padding: "8px 7px 0px",
                border: "none",
                "& fieldset": {
                  border: "none",
                },
              },

              "& .MuiOutlinedBase-input": {
                fontSize: "inherit",
                color: "inherit",
              },
            }}
            // className="hide-scrollbar"
          />
          <IconButton
            sx={{ alignSelf: "end", pb: "13px" }}
            onClick={toggleEmoji}
          >
            <Tooltip title="emoji">
              <EmojiEmotions
                sx={{ color: "var(--color-warning)", background: "transparent" }}
              />
            </Tooltip>
          </IconButton>
          <EmojiPicker
            open={showEmoji}
            style={{
              position: "absolute",
              bottom: "60px",
              right: "0px",
              zIndex: 20,
              fontSize: "0.7rem",
            }}
            width="100%"
            height="400px"
            lazyLoadEmojis
            onEmojiClick={handleEmojiClick}
            // emojiStyle=""
          />
        </Stack>
      </Stack>
    );
  }
);
MessageInput.displayName = "MessageInput";

export default MessageInput;

const StyledInput = styled(TextField)({
  flex: 1,
  backgroundColor: "inherit",
  // backgroundColor: "red",
  padding: 0,
  margin: 0,
  "&::after": {
    display: "none",
  },
  "&::before": {
    display: "none",
  },
  // "& textarea": {
  //   resize: "none",
  //   overflow: "auto",
  // },

  // "& .MuiOutlinedInput-root": {
  //   borderRadius: "0px",
  //   border: "none",
  //   "& fieldset": {
  //     border: "none",
  //   },
  // },
  // "& .MuiOutlinedBase-input": {
  //   fontSize: "inherit",
  //   lineHeight: 8,
  //   padding: "0 300px",
  //   minHeight: "500px",
  // },
  color: "var(--color-bg-primary)",
});
