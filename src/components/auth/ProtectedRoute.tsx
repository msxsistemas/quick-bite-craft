import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'reseller' | 'restaurant_admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading, isReseller } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (requiredRole === 'reseller') {
      return <Navigate to="/reseller" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'reseller' && !isReseller) {
    return <Navigate to="/reseller" replace />;
  }

  return <>{children}</>;
};
