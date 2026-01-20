import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRestaurantAdmin } from '@/hooks/useRestaurantAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';

interface RestaurantProtectedRouteProps {
  children: ReactNode;
}

export const RestaurantProtectedRoute = ({ children }: RestaurantProtectedRouteProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { admin, user: adminUser, isLoading: adminLoading } = useRestaurantAdmin();
  const { user, isLoading: authLoading, isReseller } = useAuth();

  // Grace period to allow the admin context to load after auth changes
  const adminGraceUntilRef = useRef<number | null>(null);
  const unauthorizedHandledRef = useRef(false);

  // Start grace window when we have a session but admin isn't loaded yet
  if (adminUser && !admin && adminGraceUntilRef.current === null) {
    adminGraceUntilRef.current = Date.now() + 3000;
  }

  useEffect(() => {
    if (!slug) return;
    if (adminLoading || authLoading) return;

    // Reseller can access restaurant panel (support role)
    if (user && isReseller) return;

    // Restaurant admin session
    if (adminUser) {
      // Wait a bit for admin to be fetched
      if (!admin) {
        const graceUntil = adminGraceUntilRef.current ?? 0;
        if (Date.now() < graceUntil) return;

        if (unauthorizedHandledRef.current) return;
        unauthorizedHandledRef.current = true;

        toast.error('Sua conta ainda não está vinculada a este restaurante');
        supabase.auth.signOut().finally(() => {
          navigate(`/r/${slug}/admin/login`, { replace: true });
        });
        return;
      }

      // Admin loaded but doesn't match this restaurant
      if (admin.slug !== slug) {
        if (unauthorizedHandledRef.current) return;
        unauthorizedHandledRef.current = true;

        toast.error('Acesso não autorizado para este restaurante');
        supabase.auth.signOut().finally(() => {
          navigate(`/r/${slug}/admin/login`, { replace: true });
        });
        return;
      }

      // Admin matches
      return;
    }

    // No valid session
    navigate(`/r/${slug}/admin/login`, { replace: true });
  }, [admin, adminUser, adminLoading, user, authLoading, isReseller, slug, navigate]);

  const graceUntil = adminGraceUntilRef.current ?? 0;
  const shouldWaitForAdmin = !!adminUser && !admin && Date.now() < graceUntil;

  if (adminLoading || authLoading || shouldWaitForAdmin) {
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

