import type { AUTH } from "types";

type OMIT_TOKEN_AUTH_INITIAL_STATE = Omit<AUTH, "accessToken">;

export const getLocalStorage = (): OMIT_TOKEN_AUTH_INITIAL_STATE | null => {
  const rawData = localStorage.getItem("chatApp");
  if (rawData) {
    return JSON.parse(rawData) as OMIT_TOKEN_AUTH_INITIAL_STATE;
  }
  return null;
};

export const storeToLocalStorage = (data: OMIT_TOKEN_AUTH_INITIAL_STATE) => {
  localStorage.setItem("chatApp", JSON.stringify(data));
};

export const getSessionStorage = <T>(key: string): T | null => {
  const rawData = sessionStorage.getItem(key);
  if (rawData) {
    return JSON.parse(rawData) as T;
  }
  return null;
};

export const storeToSessionStorage = <T,>(key: string, data: T) => {
  sessionStorage.setItem(key, JSON.stringify(data));
};
