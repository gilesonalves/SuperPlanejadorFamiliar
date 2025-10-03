import { Navigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuth";

export default function Entry() {
  const { user, loading } = useAuthSession();
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}
