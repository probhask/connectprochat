import { Box, Button, Stack, TextField, Typography, styled } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";
import { addAuthData } from "@store/slices/authSlice";
import toast from "react-hot-toast";
import { useChatAppDispatch } from "@store/hooks";
import useOtp from "@hooks/useOtp";

/**
 * New screen — the pre-revamp client had no OTP entry step at all, because
 * the pre-revamp server never required email verification. Reached from
 * Register on success, or from Login when it gets back the
 * EMAIL_NOT_VERIFIED error code. Verifying logs the user straight in (the
 * server's verifyEmailOtp issues tokens the same way /auth/login does —
 * see server/src/modules/otp/controllers.ts) — proving email ownership via
 * OTP is at least as strong a credential as a password, so there's no
 * reason to send a just-verified user back to a login form.
 */
const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useChatAppDispatch();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState("");
  const {
    sendOtp,
    sendResp,
    sendLoading,
    sendError,
    verifyOtp,
    verifyResp,
    verifyLoading,
    verifyError,
  } = useOtp();

  // Mutations don't reject in the submit handler either — react to the
  // resulting state, don't assume the call succeeded just because it was
  // awaited/fired.
  useEffect(() => {
    if (verifyResp?.success && verifyResp.data?._id) {
      dispatch(addAuthData({ ...verifyResp.data }));
      toast.success("Email verified — you're logged in");
      navigate(location?.state?.from || "/", { replace: true });
    }
  }, [verifyResp, navigate, dispatch, location]);

  useEffect(() => {
    if (verifyError) toast.error("Invalid or expired code");
  }, [verifyError]);

  useEffect(() => {
    if (sendResp?.success) toast.success("A new code has been sent");
  }, [sendResp]);

  useEffect(() => {
    if (sendError) toast.error("Failed to send code");
  }, [sendError]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 6) {
      toast.error("Enter your email and the 6-digit code");
      return;
    }
    verifyOtp(email, otp);
  };

  const handleResend = () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    sendOtp(email);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 500, textAlign: "center", color: "var(--color-light)", mb: 4 }}
      >
        Verify your email
      </Typography>
      <form onSubmit={handleVerify}>
        <Stack spacing={2}>
          <StyledTextField
            label="Email"
            placeholder="Email Address"
            value={email}
            // Disabled once we already know which address to verify (the
            // normal path — arrived here from Register/Login with the
            // email in nav state): editing it would just mismatch whatever
            // OTP was actually sent. Left editable only for the fallback
            // case of landing on this URL directly with no state at all.
            disabled={!!emailFromState}
            onChange={(e) => setEmail(e.target.value)}
          />
          <StyledTextField
            label="6-digit code"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputProps={{ inputMode: "numeric", maxLength: 6 }}
          />
          <Button
            type="submit"
            disabled={verifyLoading}
            sx={{
              color: "#fff",
              backgroundColor: "#000",
              ":disabled": { backgroundColor: "#181c14", color: "#fff" },
            }}
          >
            {verifyLoading ? "Verifying..." : "Verify"}
          </Button>
          <Button
            type="button"
            onClick={handleResend}
            disabled={sendLoading}
            sx={{ color: "var(--color-light)" }}
          >
            {sendLoading ? "Sending..." : "Resend code"}
          </Button>
        </Stack>
      </form>
      <Box sx={{ mt: 1 }}>
        <Typography component="span">Already verified ?</Typography>
        <Link to="/auth/login" className="text-blue-500 ml-2">
          Login
        </Link>
      </Box>
    </Box>
  );
};

export default VerifyOtp;

const StyledTextField = styled(TextField)({
  accentColor: "red",
  caretColor: "#fff",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#fff", colors: "#fff" },
    "&:hover fieldset": { borderColor: "#fff", color: "#fff" },
    "& .Mui-focused fieldset": { borderColor: "red", color: "#fff" },
    "& input": { color: "#fff" },
  },
  "& .MuiInputLabel-root": { color: "#fff" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#fff" },
});
