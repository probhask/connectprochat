import { DOC_PREVIEW, MESSAGE } from "types";
import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import axiosError from "@utils/AxiosError/axiosError";
import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";
import useChatAppContext from "@context/index";
import useMessageContext from "@context/messageContext";

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

/** Appends a message to the cached list, skipping it if already present —
 * both the HTTP response here AND the real-time messageReceived socket
 * broadcast (see SocketContext.tsx) can deliver the same message (the
 * sender is in the room too), so every write path dedupes by _id. */
function appendMessage(
  old: MESSAGE[] | undefined,
  message: MESSAGE
): MESSAGE[] | undefined {
  if (!old) return old;
  if (old.some((m) => m._id === message._id)) return old;
  return [...old, message];
}

const useMessage = () => {
  // Sender/actor come from the token server-side now — nothing here needs
  // the current user's id anymore (see sendMessage/handleDeleteMessage).
  const { selectedMessageIds, clearAllSelectedMessage } = useMessageContext();
  const { conversationRoomId: conversationId } = useChatAppContext();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<DOC_PREVIEW | null>(null);

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

  // Send message (text or, if `file` is set, multipart upload) — both
  // paths write the created message straight into
  // queryKeys.conversation.messages(conversationId)'s cache.
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, file }: { text: string; file: File | null }) => {
      if (!conversationId) throw new Error("No conversation selected");

      if (!file) {
        // Folded into the conversation module (Phase 2): sender comes
        // from the token, not the body.
        const response = await httpClient.post<ApiEnvelope<MESSAGE>>(
          `/conversation/${conversationId}/messages`,
          { text: text.trim() }
        );
        return response.data.data;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);
      formData.append("text", text || "");

      const response = await httpClient.post<ApiEnvelope<MESSAGE>>(
        "/upload/message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    },
    onSuccess: (message) => {
      if (!conversationId) return;
      queryClient.setQueryData<MESSAGE[] | undefined>(
        queryKeys.conversation.messages(conversationId),
        (old) => appendMessage(old, message)
      );
    },
    onError: (error) => axiosError(error),
  });

  const sendMessage = useCallback(
    async (message: string) => {
      if (!(message || file) || !conversationId) return;
      await sendMessageMutation.mutateAsync({ text: message, file });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, conversationId]
  );

  // Delete messages — folded into the conversation module (Phase 2):
  // acting user comes from the token, not a userId in the body.
  const deleteMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      await httpClient.delete("/conversation/messages", {
        data: { messageIds },
      });
      return messageIds;
    },
    onSuccess: (messageIds) => {
      if (!conversationId) return;
      queryClient.setQueryData<MESSAGE[] | undefined>(
        queryKeys.conversation.messages(conversationId),
        (old) => old?.filter((m) => !messageIds.includes(m._id))
      );
      toast.success("Deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleDeleteMessage = useCallback(async () => {
    if (!(selectedMessageIds.length > 0)) return;
    deleteMutation.mutate(selectedMessageIds);
  }, [selectedMessageIds, deleteMutation]);

  useEffect(() => {
    return () => {
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
    deleteLoading: deleteMutation.isPending,
  };
};

export default useMessage;
