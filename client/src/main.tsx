import "./index.css";

import { ChatAppContextProvider } from "./context";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@components/ErrorBoundary";
import LoadingFallback from "@components/Layout/LoadingFallback";
import { Provider } from "react-redux";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import chatAppStore from "./store";
import { muiTheme } from "@theme/muiTheme";
import routes from "@routes/index";

// One QueryClient for the app's lifetime — TanStack Query lands feature by
// feature through the rest of Phase 4; this provider is additive and
// doesn't change anything for features still on Redux.
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <Suspense fallback={<LoadingFallback />}>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Provider store={chatAppStore}>
          <ChatAppContextProvider>
            <ThemeProvider theme={muiTheme}>
              <CssBaseline />
              <RouterProvider router={routes} />
            </ThemeProvider>
          </ChatAppContextProvider>
        </Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  </Suspense>

  // </React.StrictMode>
);
