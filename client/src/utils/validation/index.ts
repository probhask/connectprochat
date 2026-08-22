import * as Yup from "yup";

export const LoginFormValidationSchema = Yup.object({
  // Login accepts either an email or a username (see
  // server/src/modules/user/service.ts's findUserByIdentifier) — no
  // .email() format check here, unlike Register's email field.
  identifier: Yup.string().required("Email or username is required"),
  // Login only needs to know a password was typed — the complexity rules
  // (uppercase/lowercase/digit/special char) belong on Register, where
  // they enforce what a NEW password must look like. Applying them here
  // too would reject an existing correct password that predates a
  // complexity rule change, or simply doesn't happen to match the regex.
  password: Yup.string().required("Password is required"),
});

export const RegisterFormValidationSchema = Yup.object({
  username: Yup.string()
    .min(4, "Username must contain at least 4 character")
    .max(30, "Username must not exceed 30 character")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6)
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[@$!%*?&#]/,
      "Password must contain at least one special character"
    )
    .required("Password is required"),
});

export const UpdatePersonalDataFormValidation = Yup.object({
  username: Yup.string()
    .min(4, "Username must contain at least 4 character")
    .max(30, "Username must not exceed 30 character")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export const ChangePasswordFormValidation = Yup.object({
  password: Yup.string().required("Password is required"),
  newPassword: Yup.string()
    .min(6)
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(
      /[@$!%*?&#]/,
      "Password must contain at least one special character"
    )
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword"), ""], "Password must match")
    .required("Confirm password is required"),
});
