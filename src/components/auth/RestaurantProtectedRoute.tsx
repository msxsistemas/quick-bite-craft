import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurantAdmin } from '@/hooks/useRestaurantAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RestaurantProtectedRouteProps {
  children: ReactNode;
}

export const RestaurantProtectedRoute = ({ children }: RestaurantProtectedRouteProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { admin, user: adminUser, isLoading: adminLoading } = useRestaurantAdmin();
  const { user, isLoading: authLoading, isReseller } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (adminLoading || authLoading) return;
    if (!slug) return;

    // If reseller is logged in, allow access
    if (user && isReseller) return;

    // If restaurant admin is logged in and matches the slug, allow access
    if (adminUser && admin && admin.slug === slug) return;

    // If there is an authenticated user but no permission, sign out and redirect
    if ((user && !isReseller) || adminUser) {
      if (handledRef.current) return;
      handledRef.current = true;

      toast.error('Acesso não autorizado para este restaurante');
      supabase.auth.signOut().finally(() => {
        navigate(`/r/${slug}/admin/login`, { replace: true });
      });
      return;
    }

    // No valid session
    navigate(`/r/${slug}/admin/login`, { replace: true });
  }, [admin, adminUser, adminLoading, user, authLoading, isReseller, slug, navigate]);

  if (adminLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if ((user && isReseller) || (adminUser && admin && admin.slug === slug)) {
    return <>{children}</>;
  }

  return null;
};

