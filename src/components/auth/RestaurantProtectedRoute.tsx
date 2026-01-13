import { ReactNode, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurantAdmin } from '@/hooks/useRestaurantAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface RestaurantProtectedRouteProps {
  children: ReactNode;
}

export const RestaurantProtectedRoute = ({ children }: RestaurantProtectedRouteProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { admin, user: adminUser, isLoading: adminLoading } = useRestaurantAdmin();
  const { user, isLoading: authLoading, isReseller } = useAuth();

  useEffect(() => {
    if (adminLoading || authLoading) return;

    // If reseller is logged in via Supabase Auth, allow access
    if (user && isReseller) {
      return;
    }

    // If restaurant admin is logged in, wait for admin data to resolve
    if (adminUser) {
      // adminUser exists but admin record may still be loading
      if (!admin) return;

      if (admin.slug === slug) {
        return;
      }
    }

    // No valid session, redirect to login
    navigate(`/r/${slug}/admin/login`, { replace: true });
  }, [admin, adminUser, adminLoading, user, authLoading, isReseller, slug, navigate]);

  if (adminLoading || authLoading || (adminUser && !admin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if reseller or restaurant admin
  if ((user && isReseller) || (adminUser && admin && admin.slug === slug)) {
    return <>{children}</>;
  }

  return null;
};
