import { MEDIA_TYPE, SUCCESS_RESPONSE } from "types";
import React, { createContext, useCallback, useContext } from "react";
import {
  removeProfilePicture,
  updateAuthData,
  updateProfilePic,
} from "@store/slices/authSlice";
import { useChatAppDispatch } from "@store/hooks";
import { useMutation } from "@tanstack/react-query";

import { getErrorMessage } from "@utils/AxiosError/axiosError";
import { httpClient } from "@services/apis/httpClient";
import toast from "react-hot-toast";

type ProfileContextProps = {
  profilePicLoading: boolean;
  handleUploadProfilePic: (file: File) => void;
  removePicLoading: boolean;
  handleRemoveProfilePic: () => void;
  updateProfileLoading: boolean;
  updateProfileError: boolean;
  handleUpdateProfileData: (username: string, email: string) => void;
  handleUpdatePassword: (password: string, newPassword: string) => void;
  updatePasswordError: boolean;
  updatePasswordLoading: boolean;
};

export const ProfileContext = createContext<ProfileContextProps | undefined>(
  undefined
);

/** Phase 5 — off useFetchData/useRefresh onto httpClient + useMutation.
 * Every mutation here is self-scoped server-side via the token
 * (req.userId) already — dropped the userId the pre-migration requests
 * sent in the body/params, which the server always ignored. */
export const ProfileContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useChatAppDispatch();

  //update profilePic (Post request)
  const uploadProfilePicMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await httpClient.post<{ data: MEDIA_TYPE }>(
        "/upload/profile-pic",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    },
    onSuccess: (profilePicture) => {
      dispatch(updateProfilePic(profilePicture));
      toast.success("picture updated");
    },
    onError: () => toast.error("Failed to update ProfilePic"),
  });

  const handleUploadProfilePic = useCallback(
    (file: File) => {
      if (!file) return;
      uploadProfilePicMutation.mutate(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  //delete profilePic (delete request)
  const removeProfilePicMutation = useMutation({
    mutationFn: async () => {
      const response = await httpClient.delete<SUCCESS_RESPONSE>(
        "/user/profile-pic"
      );
      return response.data;
    },
    onSuccess: () => {
      dispatch(removeProfilePicture());
      toast.success("picture deleted");
    },
    onError: () => toast.error("Failed to delete ProfilePic"),
  });

  //update profile data
  const updateProfileMutation = useMutation({
    mutationFn: async ({
      username,
      email,
    }: {
      username: string;
      email: string;
    }) => {
      const response = await httpClient.put<{
        data: { username: string; email: string };
      }>("/user/update-profile-data", { username, email });
      return response.data.data;
    },
    onSuccess: (profile) => {
      dispatch(updateAuthData(profile));
      toast.success("Successfully Updated profile");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const handleUpdateProfileData = useCallback(
    (username: string, email: string) => {
      updateProfileMutation.mutate({ username, email });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  //password update
  const updatePasswordMutation = useMutation({
    mutationFn: async ({
      password,
      newPassword,
    }: {
      password: string;
      newPassword: string;
    }) => {
      const response = await httpClient.put<SUCCESS_RESPONSE>(
        "/user/update-password",
        { password, newPassword }
      );
      return response.data;
    },
    onSuccess: () => toast.success("Passwords updated successfully"),
    onError: (error) =>
      toast.error(`Error ${getErrorMessage(error)}`),
  });

  const handleUpdatePassword = useCallback(
    (password: string, newPassword: string) => {
      updatePasswordMutation.mutate({ password, newPassword });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const value = {
    //update profile pic
    profilePicLoading: uploadProfilePicMutation.isPending,
    handleUploadProfilePic,

    //remove pic
    removePicLoading: removeProfilePicMutation.isPending,
    handleRemoveProfilePic: () => removeProfilePicMutation.mutate(),

    //update profile
    updateProfileLoading: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.isError,
    handleUpdateProfileData,

    //update password
    handleUpdatePassword,
    updatePasswordError: updatePasswordMutation.isError,
    updatePasswordLoading: updatePasswordMutation.isPending,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

const useProfileContext = () => {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfileContext hook must be used within ProfileContextProvider"
    );
  }
  return context;
};

export default useProfileContext;
