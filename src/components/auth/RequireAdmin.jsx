import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RequireAdmin({ children }) {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  if (loading) return <div className="hive-loading">Checking administrator access…</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
