import { SxProps, Theme } from "@mui/material";

import React from "react";
import { StyledUserAvatar } from "@components/MuiStyledComponent";

type ProfileAvatarProps = {
  isOnline?: boolean;
  url: string | undefined;
  alt?: string;
  sx?: SxProps<Theme> | undefined;
  handleClick?: (e: React.MouseEvent) => void;
};
const ProfileAvatar = React.memo(
  ({
    url = "",
    isOnline = false,
    alt = "",
    sx,
    handleClick,
  }: ProfileAvatarProps) => {
    return (
      <StyledUserAvatar
        live={isOnline.toString()}
        alt={alt}
        // Leave src undefined (not a URL with an empty filename segment)
        // when there's no picture — building the URL unconditionally fired
        // a real GET /api/file/ request with no filename for every
        // avatar-less user, which 404s and gets blocked by the browser as
        // an opaque/cross-origin response (console noise on every explore/
        // friends list render).
        src={url ? `${import.meta.env.VITE_BACKEND_URL}/api/file/${url}` : undefined}
        sx={sx}
        onClick={handleClick}
      >
        {/* MUI's Avatar only ever renders these children when there's no
            src, or the <img> fails to load (e.g. a stale/deleted upload) —
            always passing the initial here (not gated on `!url`) covers
            both cases, instead of falling back to the generic silhouette
            icon whenever a real src URL happens to 404. */}
        {alt ? alt.charAt(0).toUpperCase() : null}
      </StyledUserAvatar>
    );
  }
);
ProfileAvatar.displayName = "ProfileAvatar";

export default ProfileAvatar;
