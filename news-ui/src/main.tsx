import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import "./index.css";
import RequireAdminAuth from "./components/RequireAdminAuth";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminPage from "./pages/Admin/AdminPage";
import AdminTopicCreatePage from "./pages/Admin/AdminTopicCreatePage";
import AdminTopicDetailPage from "./pages/Admin/AdminTopicDetailPage";
import AdminTopicEditPage from "./pages/Admin/AdminTopicEditPage";
import HomePage from "./pages/Public/HomePage";
import TopicDetailPage from "./pages/Public/TopicDetailPage";
import SignupPage from "./pages/Public/SignupPage";
import LoginPage from "./pages/Public/LoginPage";
import MyPage from "./pages/Public/MyPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/topics/:topicId", element: <TopicDetailPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/mypage", element: <MyPage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: (
      <RequireAdminAuth>
        <AdminPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/topics/:topicId",
    element: (
      <RequireAdminAuth>
        <AdminTopicDetailPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/topics/:topicId/edit",
    element: (
      <RequireAdminAuth>
        <AdminTopicEditPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/topics/new",
    element: (
      <RequireAdminAuth>
        <AdminTopicCreatePage />
      </RequireAdminAuth>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <UserAuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </UserAuthProvider>
    </AdminAuthProvider>
  </React.StrictMode>
);
