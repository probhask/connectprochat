import * as yup from "yup";

import { objectIdSchema, objectIdTest } from "../../lib/validation/objectId";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const SRegister = yup.object({
  username: yup.string().trim().min(2).max(50).required(),
  email: yup.string().trim().lowercase().email().required(),
  password: yup.string().min(6).required(),
});

export const SLogin = yup.object({
  email: yup.string().trim().lowercase().email().required(),
  password: yup.string().required(),
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const SGetUserParams = yup.object({
  id: objectIdSchema(),
});

export const SExploreQuery = yup.object({
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().max(100).optional(),
  search: yup.string().trim().optional(),
});

export const SUpdatePersonalData = yup.object({
  username: yup.string().trim().min(2).max(50).required(),
  email: yup.string().trim().lowercase().email().required(),
});

export const SUpdatePassword = yup.object({
  password: yup.string().required(),
  newPassword: yup.string().min(6).required(),
});

export const SRemoveFriend = yup.object({
  friendId: yup.string().required().test(objectIdTest),
});

export const SSideProfileQuery = yup.object({
  profileId: yup.string().required().test(objectIdTest),
  isGroup: yup
    .string()
    .oneOf(["true", "false"])
    .required(),
});
