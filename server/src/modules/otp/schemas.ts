import * as yup from "yup";

export const SSendEmailOtp = yup.object({
  email: yup.string().trim().lowercase().email().required(),
});

export const SVerifyEmailOtp = yup.object({
  email: yup.string().trim().lowercase().email().required(),
  otp: yup.string().length(6).required(),
});
