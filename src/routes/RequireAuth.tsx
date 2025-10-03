import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null;                 // nunca redirecionar durante "loading"
  if (!user)   return <Navigate to="/login" state={{ from: loc }} replace />;

  return <Outlet />;
}
