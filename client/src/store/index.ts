import { authReducer } from "./slices";

import { configureStore } from "@reduxjs/toolkit";

const chatAppStore = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof chatAppStore.getState>;
export type AppDispatch = typeof chatAppStore.dispatch;
export default chatAppStore;
