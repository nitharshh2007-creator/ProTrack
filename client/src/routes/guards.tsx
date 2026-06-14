import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth.store";

/** Redirects unauthenticated users to /login */
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

/** Redirects authenticated users away from guest-only pages */
export const GuestRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

/** Restricts a route to admins only — redirects employees to /dashboard */
export const AdminRoute = () => {
  const { isLoading, hasRole } = useAuth();
  if (isLoading) return null;
  return hasRole("admin") ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
