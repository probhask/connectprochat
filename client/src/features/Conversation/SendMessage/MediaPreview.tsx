import { Box, Stack, Typography } from "@mui/material";
import { Close, TextSnippet } from "@mui/icons-material";

import { DOC_PREVIEW } from "types";
import React from "react";

export type MediaPreviewProps = {
  imagePreview: string | null;
  resetImagePreview: () => void;
  resetDocPreview: () => void;
  docPreview: DOC_PREVIEW | null;
};

const MediaPreview = React.memo(
  ({
    imagePreview,
    resetDocPreview,
    resetImagePreview,
    docPreview,
  }: MediaPreviewProps) => {
    return (
      <>
        {imagePreview && (
          <Box sx={{ position: "relative", width: "100px" }}>
            <Box
              component={"img"}
              alt="preview"
              src={imagePreview}
              sx={{
                width: { xs: "60px", sm: "100px" },
                height: { xs: "60px", sm: "100px" },
                objectFit: "cover",
                borderRadius: "8px",
                m: "4px",
                mt: "10px",
                ml: "8px",
              }}
            />
            <Box
              component="button"
              type="button"
              onClick={resetImagePreview}
              sx={{
                position: "absolute",
                top: 1,
                right: -13,
                background: "var(--color-danger)",
                color: "var(--color-dark)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "20px",
                height: "20px",
                overflow: "hidden",
                p: 0,
                m: 0,
                borderRadius: "50%",
              }}
            >
              <Close sx={{ width: "15px" }} />
            </Box>
          </Box>
        )}
        {docPreview && (
          <Box
            component="div"
            sx={{
              width: "200px",
              height: "auto",
              objectFit: "cover",
              borderRadius: "inherit",
              paddingInline: "8px",
              m: "4px",
              mt: "8px",
              ml: "8px",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-light)",
              display: "flex",
              alignItems: "center",
              columnGap: 1,
              position: "relative",
            }}
          >
            <Stack
              sx={{
                alignItems: "center",
                paddingBlock: "4px",
                // paddingInline: 0.7,
              }}
            >
              <TextSnippet
                sx={{ color: "inherit", bgcolor: "inherit", height: "1.2rem" }}
              />
              <Box
                component="span"
                sx={{ fontSize: "0.6rem", fontWeight: 600 }}
              >
                {docPreview.extension}
              </Box>
            </Stack>
            <Typography
              sx={{
                flex: 1,
                pl: 1,
                fontSize: "0.8rem",
                textOverflow: "clip",
                lineClamp: 1,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {docPreview.name}
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={resetDocPreview}
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "var(--color-danger)",
                color: "var(--color-dark)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "20px",
                height: "20px",
                overflow: "hidden",
                p: 0,
                m: 0,
                borderRadius: "50%",
              }}
            >
              <Close sx={{ width: "15px" }} />
            </Box>
          </Box>
        )}
      </>
    );
  }
);
MediaPreview.displayName = "MediaPreview";

export default MediaPreview;
