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

// Shared in-flight refresh promise — every 401 that lands while a refresh
// is already underway awaits THIS instead of firing its own
// /auth/refresh call. Without this, a page that fires several requests
// in parallel (now the normal case: TanStack Query hooks each query
// independently, so a single page transition can easily fire 5-6 at
// once) had every one of them race to refresh independently on a stale/
// expired token — as many concurrent /auth/refresh calls as there were
// 401s, tripping the authLimiter rate limit and, worse, dropping some
// requests' retries entirely if a later refresh response raced ahead of
// an earlier one and left the earlier request's retry using a token that
// got superseded before it even sent (observed live: a friend request
// that genuinely existed in the DB not showing up because its list
// fetch's retry got lost in the pile-up).
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = httpClient
      .get("/auth/refresh")
      .then((res) => res.data?.data?.accessToken ?? null)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

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
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      chatAppStore.dispatch(updateAccessToken(newAccessToken));
      prevRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return httpClient(prevRequest);
    }
    // No new token (refresh itself failed) — the caller (or a route
    // guard) is responsible for redirecting to login on a persistent 401.
    return Promise.reject(error);
  }
);
