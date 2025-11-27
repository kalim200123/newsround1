import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RequireAdminAuth from "./components/RequireAdminAuth";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import "./index.css";
import AdminInquiriesListPage from "./pages/Admin/AdminInquiriesListPage";
import AdminInquiryDetailPage from "./pages/Admin/AdminInquiryDetailPage";
import AdminKeywordPage from "./pages/Admin/AdminKeywordPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminNotificationPage from "./pages/Admin/AdminNotificationPage";
import AdminPage from "./pages/Admin/AdminPage";
import AdminSystemLogPage from "./pages/Admin/AdminSystemLogPage";
import AdminTopicCreatePage from "./pages/Admin/AdminTopicCreatePage";
import AdminTopicDetailPage from "./pages/Admin/AdminTopicDetailPage";
import AdminTopicEditPage from "./pages/Admin/AdminTopicEditPage";
import AdminTopicsListPage from "./pages/Admin/AdminTopicsListPage";
import AdminTopicVotesPage from "./pages/Admin/AdminTopicVotesPage";
import AdminUserDetailPage from "./pages/Admin/AdminUserDetailPage";
import AdminUsersListPage from "./pages/Admin/AdminUsersListPage";
import HomePage from "./pages/Public/HomePage";
import LoginPage from "./pages/Public/LoginPage";
import MyPage from "./pages/Public/MyPage";
import SignupPage from "./pages/Public/SignupPage";
import TopicDetailPage from "./pages/Public/TopicDetailPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },

  { path: "/topics/:topicId", element: <TopicDetailPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/mypage", element: <MyPage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin/inquiries",
    element: (
      <RequireAdminAuth>
        <AdminInquiriesListPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/inquiries/:inquiryId",
    element: (
      <RequireAdminAuth>
        <AdminInquiryDetailPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAdminAuth>
        <AdminPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/topics",
    element: (
      <RequireAdminAuth>
        <AdminTopicsListPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/topics/:topicId/votes",
    element: (
      <RequireAdminAuth>
        <AdminTopicVotesPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <RequireAdminAuth>
        <AdminUsersListPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/users/:userId",
    element: (
      <RequireAdminAuth>
        <AdminUserDetailPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/system",
    element: (
      <RequireAdminAuth>
        <AdminSystemLogPage />
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
  {
    path: "/admin/keywords",
    element: (
      <RequireAdminAuth>
        <AdminKeywordPage />
      </RequireAdminAuth>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <RequireAdminAuth>
        <AdminNotificationPage />
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
