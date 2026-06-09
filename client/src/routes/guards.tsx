import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth.store";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
