import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

const RequireAdminAuth = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
};

export default RequireAdminAuth;
