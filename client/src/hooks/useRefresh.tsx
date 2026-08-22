import { useChatAppDispatch, useChatAppSelector } from "@store/hooks";
import { useLocation, useNavigate } from "react-router-dom";

import api from "Api";
import axiosError from "@utils/AxiosError/axiosError";
import { updateAccessToken } from "@store/slices/authSlice";
import { useEffect } from "react";

// Endpoints that never carry a session to refresh — a 401 from any of these
// means "wrong credentials" / "not verified yet", not "token expired", and
// must never trigger the refresh-and-retry flow below.
const UNAUTHENTICATED_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

const refreshToken = async (controller: AbortController) => {
  try {
    const response = await api.get("/auth/refresh", {
      signal: controller.signal,
    });
    // Server wraps every response as { success, message, data }.
    return response.data?.data?.accessToken;
  } catch (error) {
    axiosError(error);
  }
};

const useRefresh = () => {
  const controller = new AbortController();
  const dispatch = useChatAppDispatch();
  const authAccessToken = useChatAppSelector((store) => store.auth.accessToken);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    //request interceptor
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const accessToken = authAccessToken; //redux
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // response interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;

        // A 401 from login/register/refresh itself is a credentials/session
        // problem, not an expired-access-token problem — never retry these
        // through the refresh flow, just let the real error reach the caller
        // (this is exactly why a failed login used to surface a confusing
        // refresh-endpoint error instead of "Invalid email or password").
        if (UNAUTHENTICATED_ENDPOINTS.includes(prevRequest?.url)) {
          return Promise.reject(error);
        }

        if (error?.response?.status === 401 && !prevRequest?.sent) {
          prevRequest.sent = true;
          const newAccessToken = await refreshToken(controller);
          if (newAccessToken) {
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            dispatch(updateAccessToken(newAccessToken));
            return api(prevRequest);
          }
          // Refresh itself failed (no valid session) — send the user back
          // to login instead of silently retrying the original request with
          // no credentials.
          navigate("/auth/login", { replace: true, state: { from: location } });
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
      controller.abort();
    };
  }, []);

  return api;
};

export default useRefresh;
