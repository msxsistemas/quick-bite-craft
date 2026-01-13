import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { 
  ArrowLeft, 
  ExternalLink, 
  Settings, 
  CreditCard, 
  Calendar, 
  Users, 
  Store,
  AlertCircle,
  Phone,
  History,
  MessageSquare,
  Loader2,
  Mail,
  Crown,
  Trash2,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RestaurantDetails {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  created_at: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  subscription?: {
    id: string;
    status: string;
    monthly_fee: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };
}

interface Admin {
  id: string;
  email: string;
  isOwner: boolean;
}

interface Communication {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

const RestaurantDetailsPage = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [isSaving, setIsSaving] = useState(false);

  // Contact form state
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Admins state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isNewAdminOwner, setIsNewAdminOwner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Communications state
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Delete confirmation state
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  // Fetch admins function
  const fetchAdmins = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_admins')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setAdmins((data || []).map(admin => ({
        id: admin.id,
        email: admin.email,
        isOwner: admin.is_owner || false
      })));
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId || !user) return;

      try {
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .eq('reseller_id', user.id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          toast.error('Restaurante não encontrado');
          navigate('/reseller/restaurants');
          return;
        }

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('restaurant_subscriptions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        const restaurantWithSub: RestaurantDetails = {
          ...restaurantData,
          subscription: subscriptionData ? {
            id: subscriptionData.id,
            status: subscriptionData.status,
            monthly_fee: Number(subscriptionData.monthly_fee),
            trial_ends_at: subscriptionData.trial_ends_at,
            current_period_end: subscriptionData.current_period_end,
          } : undefined,
        };

        setRestaurant(restaurantWithSub);
        setSubscriptionStatus(subscriptionData?.status || 'trial');
        
        // Fetch admins after restaurant is loaded
        await fetchAdmins();
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error('Erro ao carregar restaurante');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId, user, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      if (restaurant.subscription?.id) {
        // Update existing subscription
        const { error } = await supabase
          .from('restaurant_subscriptions')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', restaurant.subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('restaurant_subscriptions')
          .insert({
            restaurant_id: restaurant.id,
            status: newStatus,
            monthly_fee: 99.90,
          });

        if (error) throw error;
      }

      setSubscriptionStatus(newStatus);
      toast.success('Status da assinatura atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('Erro ao atualizar status da assinatura');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminPassword(password);
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !restaurantId) {
      toast.error('Preencha todos os campos');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('E-mail inválido');
      return;
    }

    if (newAdminPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsSaving(true);
    try {
      // Hash the password using edge function
      let hashedPassword = newAdminPassword;
      try {
        const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-password', {
          body: { action: 'hash', password: newAdminPassword }
        });
        
        if (!hashError && hashData?.hash) {
          hashedPassword = hashData.hash;
        }
      } catch (hashErr) {
        console.warn('Could not hash password, using plain text:', hashErr);
      }

      const { data, error } = await supabase
        .from('restaurant_admins')
        .insert({
          restaurant_id: restaurantId,
          email: newAdminEmail.toLowerCase().trim(),
          password_hash: hashedPassword,
          is_owner: isNewAdminOwner
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já está cadastrado para este restaurante');
        } else {
          throw error;
        }
        return;
      }
      
      setAdmins([...admins, {
        id: data.id,
        email: data.email,
        isOwner: data.is_owner || false
      }]);
      closeAdminModal();
      toast.success('Administrador criado com sucesso!');
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Erro ao criar administrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin || !newAdminEmail) {
      toast.error('E-mail é obrigatório');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('E-mail inválido');
      return;
    }

    if (newAdminPassword && newAdminPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsSaving(true);
    try {
      const updateData: { email: string; password_hash?: string; is_owner: boolean } = {
        email: newAdminEmail.toLowerCase().trim(),
        is_owner: isNewAdminOwner
      };
      
      if (newAdminPassword) {
        // Hash the password using edge function
        try {
          const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-password', {
            body: { action: 'hash', password: newAdminPassword }
          });
          
          if (!hashError && hashData?.hash) {
            updateData.password_hash = hashData.hash;
          } else {
            updateData.password_hash = newAdminPassword;
          }
        } catch (hashErr) {
          console.warn('Could not hash password, using plain text:', hashErr);
          updateData.password_hash = newAdminPassword;
        }
      }

      const { error } = await supabase
        .from('restaurant_admins')
        .update(updateData)
        .eq('id', editingAdmin.id);
      
      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já está cadastrado para este restaurante');
        } else {
          throw error;
        }
        return;
      }
      
      setAdmins(admins.map(a => 
        a.id === editingAdmin.id 
          ? { ...a, email: newAdminEmail.toLowerCase().trim(), isOwner: isNewAdminOwner }
          : a
      ));
      closeAdminModal();
      toast.success('Administrador atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Erro ao atualizar administrador');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setNewAdminEmail(admin.email);
    setNewAdminPassword('');
    setIsNewAdminOwner(admin.isOwner);
    setShowPassword(false);
    setIsAdminModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setNewAdminEmail('');
    setNewAdminPassword('');
    setIsNewAdminOwner(false);
    setShowPassword(false);
    setIsAdminModalOpen(true);
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setEditingAdmin(null);
    setNewAdminEmail('');
    setNewAdminPassword('');
    setIsNewAdminOwner(false);
    setShowPassword(false);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurant_admins')
        .delete()
        .eq('id', adminToDelete.id);
      
      if (error) throw error;
      
      setAdmins(admins.filter(a => a.id !== adminToDelete.id));
      setAdminToDelete(null);
      toast.success('Administrador removido com sucesso!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Erro ao remover administrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Digite uma nota');
      return;
    }
    const newCommunication: Communication = {
      id: Date.now().toString(),
      type: 'Manual',
      content: newNote,
      created_at: new Date().toISOString()
    };
    setCommunications([newCommunication, ...communications]);
    setNewNote('');
    setIsAddingNote(false);
    toast.success('Nota adicionada com sucesso!');
  };

  if (isLoading) {
    return (
      <AdminLayout type="reseller">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminLayout type="reseller">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Restaurante não encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/reseller/restaurants')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscriptionStatus === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : subscriptionStatus === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : subscriptionStatus === 'cancelled'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {subscriptionStatus === 'active' ? 'Ativo' 
                    : subscriptionStatus === 'pending' ? 'Pendente'
                    : subscriptionStatus === 'overdue' ? 'Atrasado'
                    : subscriptionStatus === 'cancelled' ? 'Cancelado'
                    : 'Teste'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/${restaurant.slug}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Cardápio
            </button>
            <button
              onClick={() => navigate(`/r/${restaurant.slug}/admin/dashboard`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Acessar Painel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mensalidade</p>
              <p className="font-semibold">R$ {(restaurant.subscription?.monthly_fee || 99.90).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-semibold">{new Date(restaurant.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="font-semibold">{admins.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
              <div>
              <p className="text-sm text-muted-foreground">Loja</p>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscriptionStatus === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : subscriptionStatus === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : subscriptionStatus === 'cancelled'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {subscriptionStatus === 'active' ? 'Ativa' 
                    : subscriptionStatus === 'pending' ? 'Pendente'
                    : subscriptionStatus === 'overdue' ? 'Atrasado'
                    : subscriptionStatus === 'cancelled' ? 'Cancelado'
                    : 'Teste'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border bg-transparent ${
                  restaurant.is_open
                    ? 'border-green-500 text-green-600'
                    : 'border-red-500 text-red-600'
                }`}>
                  {restaurant.is_open ? 'Aberta' : 'Fechada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="billing" className="rounded-md px-4 py-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Cobrança
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-md px-4 py-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-4 py-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="admins" className="rounded-md px-4 py-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Administradores
            </TabsTrigger>
            <TabsTrigger value="communications" className="rounded-md px-4 py-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comunicações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                Cobrança
              </h3>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-700">
                    O Mercado Pago não está configurado. Configure em{' '}
                    <span 
                      className="font-medium text-primary cursor-pointer hover:underline"
                      onClick={() => navigate('/reseller/settings')}
                    >
                      Configurações
                    </span>
                    {' → '}
                    <span className="font-medium text-primary">
                      Mercado Pago
                    </span>
                    {' '}para gerar cobranças automáticas.
                  </p>
                </div>
              </div>

              {/* Manual Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  Gerenciar Status Manualmente
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                </label>
                <Select 
                  value={subscriptionStatus} 
                  onValueChange={handleStatusChange}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Período de Teste</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Dados de Contato</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Informações do responsável pelo restaurante
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Nome do Proprietário
                  </label>
                  <Input 
                    placeholder="Nome do proprietário"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Telefone / WhatsApp
                  </label>
                  <PhoneInput 
                    value={contactPhone}
                    onChange={setContactPhone}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  E-mail de Contato
                </label>
                <Input 
                  placeholder="contato@restaurante.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  E-mail para comunicações (pode ser diferente do e-mail de cobrança)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pagamento registrado
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admins" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Administradores</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gerencie quem pode acessar o painel do restaurante
                  </p>
                </div>
                <Button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Admin
                </Button>
              </div>

              {admins.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhum administrador cadastrado</p>
                  <Button 
                    onClick={openCreateModal}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Admin
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div 
                      key={admin.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{admin.email}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {admin.isOwner ? 'Proprietário' : 'Administrador'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin.isOwner && (
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                            Owner
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditModal(admin)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setAdminToDelete(admin)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="communications" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Histórico de Comunicações</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registro de mensagens enviadas ao restaurante
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Nota
                </Button>
              </div>

              {isAddingNote && (
                <div className="mb-6 space-y-3">
                  <Textarea 
                    placeholder="Adicione uma nota sobre contato manual..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddNote}>
                      Salvar
                    </Button>
                  </div>
                </div>
              )}

              {communications.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma comunicação registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communications.map((comm) => (
                    <div 
                      key={comm.id}
                      className="flex items-start gap-3 p-4 border border-border rounded-lg"
                    >
                      <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
                            {comm.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comm.created_at).toLocaleDateString('pt-BR')} às {new Date(comm.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm">{comm.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Admin Modal */}
        <Dialog open={isAdminModalOpen} onOpenChange={(open) => !open && closeAdminModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Restaurante: {restaurant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {editingAdmin 
                    ? 'Atualize as credenciais de acesso ao painel.' 
                    : 'O usuário será criado e terá acesso ao painel deste restaurante.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail de acesso
                </label>
                <Input 
                  type="email"
                  placeholder="admin@restaurante.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {editingAdmin ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingAdmin ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button variant="outline" onClick={() => {
                    generatePassword();
                    setShowPassword(true);
                  }}>
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {editingAdmin 
                    ? 'Deixe em branco para manter a senha atual' 
                    : 'Anote a senha para enviar ao administrador'}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Proprietário</p>
                  <p className="text-xs text-muted-foreground">
                    Proprietários têm acesso total
                  </p>
                </div>
                <Checkbox 
                  checked={isNewAdminOwner}
                  onCheckedChange={(checked) => setIsNewAdminOwner(checked === true)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeAdminModal}>
                  Cancelar
                </Button>
                <Button 
                  onClick={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAdmin ? 'Salvar Alterações' : 'Criar Administrador'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover o administrador <strong>{adminToDelete?.email}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setAdminToDelete(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAdmin}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default RestaurantDetailsPage;
