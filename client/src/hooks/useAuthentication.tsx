import { addAuthData, logoutUser } from "@store/slices/authSlice";
import { useCallback, useEffect, useState } from "react";
import { useChatAppDispatch } from "@store/hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { AUTH } from "types";
import { AxiosError } from "axios";
import { getErrorMessage } from "@utils/AxiosError/axiosError";
import { httpClient } from "@services/apis/httpClient";
import toast from "react-hot-toast";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

/** Phase 5 — off useRefresh/useFetchData (the per-mount-interceptor
 * pattern httpClient.ts's doc comment describes replacing) onto
 * httpClient + useMutation. */
const useAuthentication = () => {
  const dispatch = useChatAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  ////////////////////////////////////////////////////////////////
  //login user
  // useMutation exposes only the response, not the request — track the
  // attempted identifier ourselves so a failed login can redirect to
  // verify-otp with it pre-filled.
  // Note: this is only actually usable as an email for that redirect (an
  // unverified account logging in with a username, not their email,
  // arrives at verify-otp with an empty/wrong email field unless the
  // server's EMAIL_NOT_VERIFIED response echoes the real email back,
  // which it now does — see below).
  const [attemptedEmail, setAttemptedEmail] = useState("");
  const loginMutation = useMutation({
    mutationFn: async ({
      identifier,
      password,
    }: {
      identifier: string;
      password: string;
    }) => {
      const response = await httpClient.post<ApiEnvelope<AUTH>>(
        "/auth/login",
        { identifier, password }
      );
      return response.data.data;
    },
  });

  const handleLogin = useCallback(
    (identifier: string, password: string) => {
      if (!identifier || !password) {
        toast.error("Email/username and password are required");
        return;
      }
      setAttemptedEmail(identifier);
      loginMutation.mutate({ identifier, password });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (loginMutation.data?._id) {
      dispatch(addAuthData({ ...loginMutation.data }));
      toast.success("Login successful");
      toast.loading("Redirecting...", { duration: 1000 });
      setTimeout(() => {
        navigate(location?.state?.from || "/", { replace: true });
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginMutation.data, dispatch, navigate]);

  useEffect(() => {
    if (!loginMutation.isError) return;

    // Inspect the raw AxiosError for the typed EMAIL_NOT_VERIFIED code the
    // server sends (see modules/user/controllers/auth.controllers.ts's
    // login) instead of just showing a generic toast for what's actually
    // an actionable state.
    const loginErrors = (
      loginMutation.error as AxiosError<{
        errors?: { code?: string; email?: string };
      }>
    )?.response?.data?.errors;

    if (loginErrors?.code === EMAIL_NOT_VERIFIED_CODE) {
      toast.error("Verify your email before logging in");
      // The server echoes back the account's real email (attemptedEmail
      // may have been a username, not usable for OTP delivery) — fall
      // back to it only if that's somehow missing.
      navigate("/auth/verify-otp", {
        state: { email: loginErrors.email || attemptedEmail },
      });
      return;
    }
    toast.error(getErrorMessage(loginMutation.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginMutation.isError, loginMutation.error, attemptedEmail, navigate]);

  ////////////////////////////////////////////////////////////////
  //register user
  const registerMutation = useMutation({
    mutationFn: async ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => {
      const response = await httpClient.post<
        ApiEnvelope<{ email: string; emailSent: boolean }>
      >("/auth/register", { username, email, password });
      return response.data;
    },
  });

  const handleRegister = useCallback(
    (username: string, email: string, password: string) => {
      if (!email || !password || !username) {
        toast.error("Username, email and password are required");
        return;
      }
      registerMutation.mutate({ username, email, password });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    // Registering no longer logs the user in — the server requires OTP
    // verification first. Success here just means the account was
    // created and an email was attempted.
    if (registerMutation.data?.success) {
      if (registerMutation.data.data.emailSent) {
        toast.success(registerMutation.data.message);
      } else {
        toast.error(
          "Registered, but the verification email failed to send — use resend on the next screen"
        );
      }
      navigate("/auth/verify-otp", {
        state: { email: registerMutation.data.data.email },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerMutation.data, navigate]);

  useEffect(() => {
    if (registerMutation.isError) {
      toast.error(`Error ${getErrorMessage(registerMutation.error)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerMutation.isError, registerMutation.error]);

  ////////////////////////////////////////////////////////////////////////
  //logout
  const handleLogoutUser = useCallback(async () => {
    setLogoutLoading(true);

    try {
      const response = await httpClient.post("/auth/logout");
      if (response.data.success) {
        dispatch(logoutUser());
        toast.success("logout successful");
        navigate("/auth/login");
      }
    } catch (error) {
      // Note: axiosError() (the default export) throws rather than
      // returning — calling it here would make everything after it dead
      // code. Use getErrorMessage for a message to actually show.
      toast.error(`Logout failed: ${getErrorMessage(error)}`);
    } finally {
      setLogoutLoading(false);
    }
  }, [dispatch, navigate]);

  return {
    //login
    loginLoading: loginMutation.isPending,
    handleLogin,

    //register
    handleRegister,
    registerLoading: registerMutation.isPending,

    //logout
    logoutLoading,
    handleLogoutUser,
  };
};

export default useAuthentication;
