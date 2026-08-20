import { InferType } from "yup";

import {
  SExploreQuery,
  SGetUserParams,
  SLogin,
  SRegister,
  SRemoveFriend,
  SSideProfileQuery,
  SUpdatePassword,
  SUpdatePersonalData,
} from "./schemas";

export type TRegister = InferType<typeof SRegister>;
export type TLogin = InferType<typeof SLogin>;
export type TGetUserParams = InferType<typeof SGetUserParams>;
export type TExploreQuery = InferType<typeof SExploreQuery>;
export type TUpdatePersonalData = InferType<typeof SUpdatePersonalData>;
export type TUpdatePassword = InferType<typeof SUpdatePassword>;
export type TRemoveFriend = InferType<typeof SRemoveFriend>;
export type TSideProfileQuery = InferType<typeof SSideProfileQuery>;
