import App from "../App";
import AuthenticationPage from "@pages/AuthenticationPage";
import ChatPage from "@pages/ChatPage";
import ChatPreviewList from "@features/ChatPreviewList";
import ErrorBoundary from "@components/ErrorBoundary";
import Explore from "@pages/Explore";
import FriendRequestPage from "@pages/FriendRequestPage";
import FriendsListPage from "@pages/FriendsListPage";
import Login from "@features/Authentication/Login";
import NotFoundPage from "@pages/NotFoundPage";
import Profile from "@pages/Profile";
import ProtectedRoute from "@components/ProtectedRoute";
import Register from "@features/Authentication/Register";
import VerifyOtp from "@features/Authentication/VerifyOtp";
import UpdatePassword from "@features/Profile/UpdatePassword";
import UpdatePersonalData from "@features/Profile/UpdatePersonalData";
import UserData from "@features/Profile/UserData";
import { createBrowserRouter } from "react-router-dom";

const routes = createBrowserRouter([
  {
    path: "",
    element: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "",
            element: <ChatPreviewList />,
          },
          {
            path: "friends",
            element: <FriendsListPage />,
          },
          {
            path: "friend-request",
            element: <FriendRequestPage />,
          },
          {
            path: "explore",
            element: <Explore />,
          },
          // {
          //   path: "create-group",
          //   element: <CreateGroup />,
          // },
        ],
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "",
            element: <UserData />,
          },
          {
            path: "update-personal",
            element: <UpdatePersonalData />,
          },
          {
            path: "update-password",
            element: <UpdatePassword />,
          },
        ],
      },

      {
        path: "auth",
        element: <AuthenticationPage />,
        children: [
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "register",
            element: <Register />,
          },
          {
            path: "verify-otp",
            element: <VerifyOtp />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
export default routes;
