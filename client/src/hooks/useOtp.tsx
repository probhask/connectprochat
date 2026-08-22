import { useCallback } from "react";

import { AUTH } from "types";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/**
 * Talks to the new modules/otp endpoints (server/src/modules/otp/routes.ts).
 * Follows the same useFetchData pattern the rest of the auth feature uses —
 * kept consistent with useAuthentication.tsx rather than jumping ahead to
 * TanStack Query here; that migration happens for this whole feature at
 * once, not piecemeal.
 *
 * useFetchData's fetchData() never rejects on failure (it catches
 * internally and sets an `error` state instead) — callers must check the
 * returned `success`/`error` state, not assume the awaited call succeeded.
 */
const useOtp = () => {
  const [sendResp, sendLoading, sendError, sendOtpRequest, abortSend] =
    useFetchData<{ success: boolean; message: string }>("/otp/email/send", "POST");
  // Verifying now logs the user in directly (see modules/otp/controllers.ts)
  // — the response carries the same AUTH shape as /auth/login's.
  const [verifyResp, verifyLoading, verifyError, verifyOtpRequest, abortVerify] =
    useFetchData<ApiEnvelope<AUTH>>("/otp/email/verify", "POST");

  const sendOtp = useCallback(
    (email: string) => sendOtpRequest({ data: { email } }),
    [sendOtpRequest]
  );

  const verifyOtp = useCallback(
    (email: string, otp: string) => verifyOtpRequest({ data: { email, otp } }),
    [verifyOtpRequest]
  );

  return {
    sendOtp,
    sendResp,
    sendLoading,
    sendError,
    abortSend,
    verifyOtp,
    verifyResp,
    verifyLoading,
    verifyError,
    abortVerify,
  };
};

export default useOtp;
