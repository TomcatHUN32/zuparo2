import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-neutral-500">Betöltés...</div>;
  if (!user) return <Navigate to="/belepes" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
