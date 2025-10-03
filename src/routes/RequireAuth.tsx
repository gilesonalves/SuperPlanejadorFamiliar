import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";

export default function RequireAuth() {
  const { user, loading } = useAuthSession();
  const loc = useLocation();
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!user)   return <Navigate to="/login" state={{ from: loc }} replace />;
  return <Outlet />;
}
