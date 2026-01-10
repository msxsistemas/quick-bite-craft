import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, Users, ShoppingBag, TrendingUp, LogOut, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CreateRestaurantModal } from '@/components/reseller/CreateRestaurantModal';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;

const ResellerDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRestaurants = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/reseller');
  };

  const stats = [
    { label: 'Restaurantes', value: restaurants.length.toString(), icon: Store, color: 'bg-primary/10 text-primary' },
    { label: 'Usuários Ativos', value: '0', icon: Users, color: 'bg-success/10 text-success' },
    { label: 'Pedidos Hoje', value: '0', icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
    { label: 'Faturamento', value: 'R$ 0', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {profile?.name || 'Revendedor'}! 👋
            </h1>
            <p className="text-muted-foreground">Visão geral do seu sistema</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="delivery-card p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Restaurants List or Empty State */}
        {isLoading ? (
          <div className="delivery-card p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Carregando...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="delivery-card p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nenhum restaurante cadastrado
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece criando seu primeiro restaurante para gerenciar cardápios, pedidos e muito mais.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="delivery-btn-primary max-w-xs"
            >
              Criar Restaurante
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Seus Restaurantes</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Restaurante
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="delivery-card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <span className={`delivery-badge ${restaurant.is_open ? 'delivery-badge-success' : 'delivery-badge-error'}`}>
                      {restaurant.is_open ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">/{restaurant.slug}</p>
                  
                  <div className="flex gap-2">
                    <a
                      href={`/r/${restaurant.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver Cardápio
                    </a>
                    <button
                      onClick={() => navigate(`/r/${restaurant.slug}/admin/dashboard`)}
                      className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateRestaurantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRestaurants}
      />
    </AdminLayout>
  );
};

export default ResellerDashboard;
