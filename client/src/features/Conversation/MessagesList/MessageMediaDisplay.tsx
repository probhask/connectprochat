import { Box, IconButton, Stack, Typography } from "@mui/material";
import { DownloadForOffline, TextSnippet } from "@mui/icons-material";
import React, { useMemo } from "react";

import { LazyLoadImage } from "react-lazy-load-image-component";
import type { MEDIA_TYPE } from "types";
import axiosError from "@utils/AxiosError/axiosError";
import { getDocPreview } from "@utils/getDocPreview";
import { httpClient } from "@services/apis/httpClient";

type MessageMediaDisplayProps = {
  media: MEDIA_TYPE;
  isOwn: boolean;
};

const MessageMediaDisplay = React.memo(
  ({ media, isOwn = false }: MessageMediaDisplayProps) => {
    const docPreview: { extension: string; preview: string } = useMemo(() => {
      let createPreview: string = "";
      let extension: string = "";
      if (media) {
        const ext = media.originalName.split(".").pop()?.toLowerCase();
        if (!media.mimetype.startsWith("image/")) {
          if (ext) {
            extension = ext;
            const preview = getDocPreview(ext);
            if (preview) {
              createPreview = preview;
            }
          }
        }
      }
      return { extension, preview: createPreview };
    }, [media]);

    const downloadFile = async (fileName: string) => {
      try {
        const response = await httpClient.get(`/download/${fileName}`, {
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (error) {
        axiosError(error);
      }
    };
    return (
      <>
        {/* image */}
        {media && media.mimetype.startsWith("image/") && (
          <Box
            sx={{
              position: "relative",
              // backgroundColor: isOwn ? "inherit" : "var(--color-light-gray)",
              // width: "300px",
              // height: "200px",
              // minHeight: "200px",
              // minWidth: "300px",
            }}
          >
            <LazyLoadImage
              alt="image"
              effect="opacity"
              // height={"200px"}
              // width={"300px"}
              src={`${import.meta.env.VITE_BACKEND_URL}/api/file/${media?.fileName}`}
              style={{ objectFit: "contain", maxHeight: "300px" }}
            />
            <IconButton
              sx={{ position: "absolute", bottom: 0, right: 0 }}
              onClick={() => {
                downloadFile(media.fileName);
              }}
            >
              <DownloadForOffline />
            </IconButton>
          </Box>
        )}

        {/* doc */}
        {media && !media.mimetype.startsWith("image/") && (
          <Box
            component="div"
            sx={{
              backgroundColor: isOwn ? "var(--color-bg-primary)" : "var(--color-light-gray)",
              color: "var(--color-dark)",
              width: {
                sm: "250px",
                md: "300px",
              },
            }}
          >
            {docPreview && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: 1,
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <Stack
                  sx={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    sx={{
                      alignItems: "center",
                      paddingBlock: "4px",
                      paddingInline: 0.7,
                    }}
                  >
                    <TextSnippet
                      sx={{ color: "inherit", bgcolor: "inherit" }}
                    />
                    <Box
                      component="span"
                      sx={{ fontSize: "0.7rem", fontWeight: 700 }}
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
                    {media?.originalName}
                  </Typography>
                </Stack>
                <IconButton
                  sx={{
                    alignSelf: "end",
                  }}
                  onClick={() => {
                    downloadFile(media.fileName);
                  }}
                >
                  <DownloadForOffline />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
      </>
    );
  }
);

export default MessageMediaDisplay;
