import { useMutation } from "@tanstack/react-query";

import { AUTH } from "types";
import { httpClient } from "@services/apis/httpClient";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/**
 * Talks to the new modules/otp endpoints (server/src/modules/otp/routes.ts).
 * Phase 5 — off useFetchData/useRefresh onto httpClient + useMutation.
 */
const useOtp = () => {
  const sendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await httpClient.post<{ success: boolean; message: string }>(
        "/otp/email/send",
        { email }
      );
      return response.data;
    },
  });

  // Verifying now logs the user in directly (see modules/otp/controllers.ts)
  // — the response carries the same AUTH shape as /auth/login's.
  const verifyMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const response = await httpClient.post<ApiEnvelope<AUTH>>(
        "/otp/email/verify",
        { email, otp }
      );
      return response.data;
    },
  });

  return {
    sendOtp: (email: string) => sendMutation.mutate(email),
    sendResp: sendMutation.data,
    sendLoading: sendMutation.isPending,
    sendError: sendMutation.isError,

    verifyOtp: (email: string, otp: string) =>
      verifyMutation.mutate({ email, otp }),
    verifyResp: verifyMutation.data,
    verifyLoading: verifyMutation.isPending,
    verifyError: verifyMutation.isError,
  };
};

export default useOtp;
