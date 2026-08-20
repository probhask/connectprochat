import axios from "axios";

import { env } from "@config/env";
import chatAppStore from "@store";
import { updateAccessToken } from "@store/slices/authSlice";

/**
 * The one Axios instance + one pair of interceptors for the whole app,
 * registered once at module load — replaces `Api/index.tsx`'s two
 * unconfigured instances and `hooks/useRefresh.tsx`'s pattern of
 * registering a fresh request/response interceptor on every component
 * mount (and ejecting them on unmount), which meant N mounted components
 * each carrying their own copy of the same interceptor logic.
 *
 * Reads/writes the Redux auth slice directly for now — this is the interim
 * bridge while Redux is still the session-state owner. Once the `authSlice`
 * migrates to `contexts/AuthContext.tsx` (later in Phase 4), this file
 * updates to read/write that instead; nothing outside this file needs to
 * change when that happens, since every caller only ever imports
 * `httpClient` itself.
 */
export const httpClient = axios.create({
  baseURL: `${env.BACKEND_URL}/api`,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const accessToken = chatAppStore.getState().auth.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error?.config;
    if (error?.response?.status !== 401 || prevRequest?.sent) {
      return Promise.reject(error);
    }

    if (prevRequest.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    prevRequest.sent = true;
    try {
      const { data } = await httpClient.get("/auth/refresh");
      const newAccessToken = data?.data?.accessToken;
      if (newAccessToken) {
        chatAppStore.dispatch(updateAccessToken(newAccessToken));
        prevRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return httpClient(prevRequest);
      }
    } catch {
      // fall through to reject below — the caller (or a route guard) is
      // responsible for redirecting to login on a persistent 401.
    }
    return Promise.reject(error);
  }
);
