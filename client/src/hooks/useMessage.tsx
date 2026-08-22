import { DOC_PREVIEW, MESSAGE } from "types";
import React, { useCallback, useEffect, useState } from "react";
import { addMessage, removeMessages } from "@store/slices/conversation";
import { useChatAppDispatch } from "@store/hooks";

import axiosError from "@utils/AxiosError/axiosError";
import toast from "react-hot-toast";
import useChatAppContext from "@context/index";
import useFetchData from "./useFetchData";
import useMessageContext from "@context/messageContext";
import useRefresh from "./useRefresh";

// import useSocketContext from "@context/SocketContext";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const updateDocPreview = (uploadedFileName: string): DOC_PREVIEW => {
  if (uploadedFileName) {
    const ext = uploadedFileName.split(".").pop()?.toLowerCase();
    if (ext) {
      return { extension: ext, name: uploadedFileName };
    }
    return { extension: "?", name: "unsupported" };
  }
  return { extension: "?", name: "not found" };
};

const useMessage = () => {
  // Sender/actor come from the token server-side now — nothing here needs
  // the current user's id anymore (see sendMessage/handleDeleteMessage).
  const { selectedMessageIds, clearAllSelectedMessage } = useMessageContext();
  const { conversationRoomId: conversationId } = useChatAppContext();
  // const { socket } = useSocketContext();
  const api = useRefresh();

  const dispatch = useChatAppDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<DOC_PREVIEW | null>(null);
  const controller = new AbortController();

  // file change
  const resetImagePreview = useCallback(() => {
    setImagePreview(null);
    setFile(null);
  }, []);
  const resetDocPreview = useCallback(() => {
    setDocPreview(null);
    setFile(null);
  }, []);
  const resetMedia = useCallback(() => {
    setDocPreview(null);
    setImagePreview(null);
    setFile(null);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = e.target.files?.[0];
      if (uploadedFile) {
        setFile(uploadedFile);
        const uploadedFileName = uploadedFile.name;

        const fileType = uploadedFile.type;

        //if image
        if (fileType.startsWith("image/")) {
          const reader = new window.FileReader();
          setDocPreview(null);

          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(uploadedFile);
          reader.onerror = () => {
            toast.error("Couldn't read that file");
          };
        } else {
          const createdPreview = updateDocPreview(uploadedFileName);
          setImagePreview(null);
          setDocPreview(createdPreview);
        }
      }
    },
    []
  );

  //Send  Messages (POST request)
  const sendMessage = useCallback(
    async (message: string) => {
      try {
        if (!(message || file) || !conversationId) {
          return;
        }

        // solo message — folded into the conversation module (Phase 2):
        // /message/send no longer exists, it's POST
        // /conversation/:id/messages, sender comes from the token (no
        // senderId in the body), and the message is the wrapped
        // { success, message, data } envelope's data, not .message.
        if (!file) {
          const response = await api.post<ApiEnvelope<MESSAGE>>(
            `/conversation/${conversationId}/messages`,
            { text: message.trim() },
            { signal: controller.signal }
          );
          if (response.data?.data) {
            dispatch(addMessage(response.data.data));
            // socket.emit("sendMessage", response.data.data);
          }
          return;
        }

        // file upload message — /upload/message is unchanged, but it only
        // takes { conversationId, text } (multipart) now; sender comes
        // from the token, and the created message is response.data.data.
        const text = message || "";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversationId);
        formData.append("text", text);

        const response = await api.post<ApiEnvelope<MESSAGE>>(
          "/upload/message",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.data?.data) {
          dispatch(addMessage(response.data.data));
          // socket.emit("send-message", response.data.data);
        }
      } catch (error) {
        axiosError(error);
      }
    },
    [file, conversationId, api]
  );

  //Delete  Messages (DELETE request)
  // Folded into the conversation module (Phase 2) — /message/delete no
  // longer exists, it's DELETE /conversation/messages, and the acting
  // user comes from the token (no userId in the body).
  const [deleteData, deleteLoading, deleteError, deleteMessage, ,] =
    useFetchData<ApiEnvelope<null>>("/conversation/messages", "DELETE");

  const handleDeleteMessage = useCallback(async () => {
    if (!(selectedMessageIds.length > 0)) {
      return;
    }

    deleteMessage({
      data: {
        messageIds: selectedMessageIds,
      },
    });
  }, [selectedMessageIds]);

  useEffect(() => {
    if (deleteData?.success && selectedMessageIds.length > 0) {
      dispatch(removeMessages(selectedMessageIds));
      // socket.emit("remove-message", selectedMessageIds);

      // clearAllSelectedMessage();
    }
  }, [deleteData, dispatch]);

  useEffect(() => {
    if (deleteError && !deleteLoading) {
      toast.error("failed to delete");
    }
  }, [deleteError]);

  useEffect(() => {
    return () => {
      controller.abort();
      clearAllSelectedMessage();
    };
  }, []);

  return {
    handleFileChange,
    sendMessage,
    imagePreview,
    docPreview,
    resetDocPreview,
    resetImagePreview,
    resetMedia,
    handleDeleteMessage,
    deleteLoading,
  };
};

export default useMessage;
