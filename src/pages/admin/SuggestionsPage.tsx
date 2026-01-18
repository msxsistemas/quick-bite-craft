import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  MessageSquare, 
  Star, 
  Filter, 
  Calendar,
  User,
  Phone,
  ChevronDown,
  Check,
  Search,
  Smartphone
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useSuggestionsList } from '@/hooks/useSuggestions';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ratingEmojis: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😫', label: 'Horrível' },
  2: { emoji: '🙁', label: 'Ruim' },
  3: { emoji: '🙂', label: 'Ok' },
  4: { emoji: '😊', label: 'Boa' },
  5: { emoji: '🤩', label: 'Ótima' },
};

const SuggestionsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate date filters
  const getDateFilters = () => {
    const now = new Date();
    let startDate: string | undefined;
    
    switch (periodFilter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
        break;
      default:
        startDate = undefined;
    }
    
    return { startDate };
  };

  const { startDate } = getDateFilters();

  const { data: suggestions = [], isLoading } = useSuggestionsList(restaurant?.id, {
    rating: ratingFilter,
    startDate,
    source: sourceFilter,
  });

  // Filter by search term
  const filteredSuggestions = suggestions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.message?.toLowerCase().includes(term) ||
      s.customer_name?.toLowerCase().includes(term) ||
      s.customer_phone?.includes(term)
    );
  });

  // Calculate stats
  const averageRating = suggestions.length > 0
    ? suggestions.reduce((sum, s) => sum + s.rating, 0) / suggestions.length
    : 0;

  const ratingCounts = suggestions.reduce((acc, s) => {
    acc[s.rating] = (acc[s.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Sugestões e Avaliações</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {suggestions.length} avaliações recebidas
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <span className="text-xl font-bold text-primary">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 5.0</span>
          </div>
        </div>

        {/* Rating Summary Cards */}
        <div className="grid grid-cols-5 gap-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setRatingFilter(ratingFilter === rating ? undefined : rating)}
              className={`p-3 rounded-xl border transition-all ${
                ratingFilter === rating
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <span className="text-2xl block mb-1">{ratingEmojis[rating].emoji}</span>
              <span className="text-lg font-bold text-foreground">{ratingCounts[rating] || 0}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por mensagem, nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Period Filter */}
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter || 'all'} onValueChange={(v) => setSourceFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[150px]">
              <Smartphone className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="waiter_app">App Garçom</SelectItem>
              <SelectItem value="customer_app">App Cliente</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(ratingFilter || sourceFilter || periodFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setRatingFilter(undefined);
                setSourceFilter(undefined);
                setPeriodFilter('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Suggestions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhuma sugestão encontrada</p>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Rating Emoji */}
                    <div className="text-3xl">
                      {ratingEmojis[suggestion.rating]?.emoji}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Customer Info */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {suggestion.customer_name && (
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span>{suggestion.customer_name}</span>
                          </div>
                        )}
                        {suggestion.customer_phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{suggestion.customer_phone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Message */}
                      {suggestion.message ? (
                        <p className="text-foreground">{suggestion.message}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Sem mensagem</p>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(suggestion.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {suggestion.source && (
                          <span className="px-2 py-0.5 bg-muted rounded-full">
                            {suggestion.source === 'waiter_app' ? 'App Garçom' : 'App Cliente'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium
                    ${suggestion.rating >= 4 ? 'bg-green-100 text-green-700' : ''}
                    ${suggestion.rating === 3 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${suggestion.rating <= 2 ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {ratingEmojis[suggestion.rating]?.label}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SuggestionsPage;
