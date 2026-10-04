import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><span className="loader" /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}