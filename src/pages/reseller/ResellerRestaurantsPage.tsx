import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, Plus, Search, MoreVertical, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateRestaurantModal } from '@/components/reseller/CreateRestaurantModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRestaurantSubscriptions } from '@/hooks/useRestaurantSubscriptions';

const ResellerRestaurantsPage = () => {
  const navigate = useNavigate();
  const { restaurants, isLoading, refetch } = useRestaurantSubscriptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const subscriptionStatus = r.subscription?.status || 'trial';
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'trial' && (subscriptionStatus === 'trial' || !r.subscription)) ||
                         (statusFilter === 'active' && subscriptionStatus === 'active') ||
                         (statusFilter === 'suspended' && subscriptionStatus === 'suspended') ||
                         (statusFilter === 'cancelled' && subscriptionStatus === 'cancelled');
    return matchesSearch && matchesStatus;
  });

  const openDetails = (restaurantId: string) => {
    navigate(`/reseller/restaurants/${restaurantId}`);
  };

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Restaurantes</h1>
            <p className="text-muted-foreground">{restaurants.length} restaurantes cadastrados</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Restaurante
          </button>
        </div>

        {/* Filters */}
        <div className="delivery-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="trial">Em teste</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Restaurant Grid */}
        {isLoading ? (
          <div className="delivery-card p-12 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Carregando...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="delivery-card p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nenhum restaurante encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Tente outra busca' : 'Comece criando seu primeiro restaurante'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="delivery-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        restaurant.is_open 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {restaurant.is_open ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 hover:bg-muted rounded">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDetails(restaurant.id)}>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-4">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                    restaurant.subscription?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {restaurant.subscription?.status === 'active' ? 'Ativo' : 'Período de Teste'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>R$ {(restaurant.subscription?.monthly_fee || 0).toFixed(2).replace('.', ',')}/mês</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(restaurant.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openDetails(restaurant.id)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => navigate(`/r/${restaurant.slug}/admin/dashboard`)}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    Acessar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateRestaurantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </AdminLayout>
  );
};

export default ResellerRestaurantsPage;
