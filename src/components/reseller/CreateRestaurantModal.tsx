import { useState } from 'react';
import { X, Store, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Formata telefone: (11) 99999-9999
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Gera senha aleatória
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const CreateRestaurantModal = ({ isOpen, onClose, onSuccess }: CreateRestaurantModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleGeneratePassword = () => {
    setAdminPassword(generatePassword());
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!name.trim()) {
      toast.error('Nome do restaurante é obrigatório');
      return;
    }

    if (!adminEmail.trim()) {
      toast.error('E-mail do administrador é obrigatório');
      return;
    }

    if (!adminPassword.trim() || adminPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      toast.error('E-mail inválido');
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(name);
      
      // Check if slug already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      const finalSlug = existingRestaurant 
        ? `${slug}-${Date.now().toString(36)}` 
        : slug;

      // Hash the password using edge function
      let hashedPassword = adminPassword;
      try {
        const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-password', {
          body: { action: 'hash', password: adminPassword }
        });
        
        if (!hashError && hashData?.hash) {
          hashedPassword = hashData.hash;
        }
      } catch (hashErr) {
        console.warn('Could not hash password, using plain text:', hashErr);
      }

      // Create restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: name.trim(),
          slug: finalSlug,
          phone: whatsapp.trim() || null,
          whatsapp: whatsapp.trim() || null,
          address: address.trim() || null,
          reseller_id: user.id,
          is_open: true,
          delivery_time: '30-45 min',
          delivery_fee: 0
        })
        .select()
        .single();

      if (restaurantError) {
        console.error('Error creating restaurant:', restaurantError);
        throw restaurantError;
      }

      // Create admin for the restaurant with hashed password
      const { error: adminError } = await supabase
        .from('restaurant_admins')
        .insert({
          restaurant_id: restaurantData.id,
          email: adminEmail.trim().toLowerCase(),
          password_hash: hashedPassword,
          is_owner: true
        });

      if (adminError) {
        console.error('Error creating admin:', adminError);
        // Don't throw, restaurant is already created
        toast.warning('Restaurante criado, mas houve erro ao criar o administrador');
      }

      toast.success('Restaurante criado com sucesso!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao criar restaurante');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setWhatsapp('');
    setAddress('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Criar Restaurante</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Restaurant Info */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nome do Restaurante *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Burger House"
              className="delivery-input"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="delivery-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número - Bairro, Cidade"
              className="delivery-input"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Administrador do Restaurante
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Credenciais para acessar o painel do restaurante
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-mail do Admin *
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@restaurante.com"
              className="delivery-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Senha do Admin *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="delivery-input pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
              >
                Gerar
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 delivery-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Restaurante'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
