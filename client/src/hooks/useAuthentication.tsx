import { addAuthData, logoutUser } from "@store/slices/authSlice";
import { useCallback, useEffect, useState } from "react";
import { useChatAppDispatch } from "@store/hooks";
import { useLocation, useNavigate } from "react-router-dom";

import { AUTH } from "types";
import axiosError from "@utils/AxiosError/axiosError";
import toast from "react-hot-toast";
import useFetchData from "./useFetchData";
import useRefresh from "./useRefresh";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

const useAuthentication = () => {
  const dispatch = useChatAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);
  const api = useRefresh(); // the Axios instance that actually carries the auth header

  ////////////////////////////////////////////////////////////////
  //login user
  const [
    loginResp,
    loginLoading,
    loginError,
    loginUser,
    abortLogin,
    ,
    loginDetailError,
  ] = useFetchData<ApiEnvelope<AUTH>>("/auth/login", "POST");
  // useFetchData exposes only the response, not the request — track the
  // attempted identifier ourselves so a failed login can redirect to
  // verify-otp with it pre-filled (loginResp stays null on failure).
  // Note: this is only actually usable as an email for that redirect (an
  // unverified account logging in with a username, not their email,
  // arrives at verify-otp with an empty/wrong email field — a
  // pre-existing rough edge, since the server's EMAIL_NOT_VERIFIED
  // response doesn't currently echo the account's email back).
  const [attemptedEmail, setAttemptedEmail] = useState("");
  const handleLogin = useCallback(
    async (identifier: string, password: string) => {
      if (!identifier || !password) {
        toast.error("Email/username and password are required");
        return;
      }
      setAttemptedEmail(identifier);
      loginUser({
        data: { identifier, password },
      });
    },
    [loginUser]
  );

  useEffect(() => {
    if (loginResp?.data?._id && !loginLoading) {
      dispatch(addAuthData({ ...loginResp.data }));
      toast.success("Login successful");
      toast.loading("Redirecting...", { duration: 1000 });
      setTimeout(() => {
        navigate(location?.state?.from || "/", { replace: true });
      }, 1000);
    }
  }, [loginResp, loginLoading, dispatch, navigate]);

  useEffect(() => {
    if (!loginError || loginLoading) return;

    // A raw AxiosError, not the parsed error message string — inspect it
    // for the typed EMAIL_NOT_VERIFIED code the server sends (see
    // modules/user/controllers/auth.controllers.ts's login) instead of
    // just showing a generic toast for what's actually an actionable state.
    const loginErrors = (
      loginDetailError as {
        response?: { data?: { errors?: { code?: string; email?: string } } };
      }
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
    toast.error(loginError);
  }, [loginError, loginLoading, loginDetailError, attemptedEmail, navigate]);

  ////////////////////////////////////////////////////////////////
  //register user
  const [
    registerResp,
    registerLoading,
    registerError,
    registerUser,
    abortRegister,
  ] = useFetchData<ApiEnvelope<{ email: string; emailSent: boolean }>>(
    "/auth/register",
    "POST"
  );
  const handleRegister = useCallback(
    async (username: string, email: string, password: string) => {
      if (!email || !password || !username) {
        toast.error("Username, email and password are required");
        return;
      }
      registerUser({
        data: { email, password, username },
      });
    },
    [registerUser]
  );

  useEffect(() => {
    // Registering no longer logs the user in (no accessToken/_id in the
    // response) — the server requires OTP verification first. Success here
    // just means the account was created and an email was attempted.
    if (registerResp?.success && !registerLoading) {
      if (registerResp.data.emailSent) {
        toast.success(registerResp.message);
      } else {
        toast.error("Registered, but the verification email failed to send — use resend on the next screen");
      }
      navigate("/auth/verify-otp", { state: { email: registerResp.data.email } });
    }
  }, [registerResp, registerLoading, navigate]);
  useEffect(() => {
    if (registerError && !registerLoading) {
      toast.error(`Error ${registerError}`);
    }
  }, [registerError, registerLoading]);

  ////////////////////////////////////////////////////////////////////////
  //logout
  const handleLogoutUser = useCallback(async () => {
    setLogoutLoading(true);

    try {
      // `api` (from useRefresh), not the plain `Axios` export — only `api`
      // carries the Authorization header, and /auth/logout now requires it
      // (verifyJWT-gated server-side, scoped to req.userId).
      const response = await api.post("/auth/logout");
      if (response.data.success) {
        dispatch(logoutUser());
        toast.success("logout successful");
        navigate("/auth/login");
      }
    } catch (error) {
      axiosError(error);

      toast.error(`Error logout failed`);
    } finally {
      setLogoutLoading(false);
    }
  }, [api, dispatch, navigate]);

  useEffect(() => {
    return () => {
      // abortLogout();
      abortLogin();
      abortRegister();
    };
  }, []);
  return {
    //login
    loginLoading,
    handleLogin,

    //register
    handleRegister,
    registerLoading,

    //logout
    logoutLoading,
    handleLogoutUser,
  };
};

export default useAuthentication;
