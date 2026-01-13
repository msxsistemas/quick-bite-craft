import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLoginProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ type, restaurantSlug }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const verifyPassword = async (inputPassword: string, storedHash: string): Promise<boolean> => {
    try {
      // Check if it's a bcrypt hash (starts with $2) or PBKDF2 hash (starts with pbkdf2:)
      if (storedHash.startsWith('$2') || storedHash.startsWith('pbkdf2:')) {
        const { data, error } = await supabase.functions.invoke('hash-password', {
          body: { action: 'verify', password: inputPassword, hash: storedHash }
        });
        
        if (error) throw error;
        return data?.valid === true;
      } else {
        // Plain text comparison for legacy passwords (will be migrated)
        return inputPassword === storedHash;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      // Fallback to plain text comparison
      return inputPassword === storedHash;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (type === 'reseller') {
        // Reseller login uses Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          toast.error('Email ou senha incorretos');
          return;
        }
        
        navigate('/reseller/dashboard');
      } else {
        // Restaurant admin login uses restaurant_admins table
        if (!restaurantSlug) {
          toast.error('Restaurante não identificado');
          return;
        }

        // First, get the restaurant by slug
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('slug', restaurantSlug)
          .maybeSingle();

        if (restaurantError || !restaurant) {
          toast.error('Restaurante não encontrado');
          return;
        }

        // Then, check credentials in restaurant_admins
        const { data: admin, error: adminError } = await supabase
          .from('restaurant_admins')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (adminError || !admin) {
          toast.error('Email ou senha incorretos');
          return;
        }

        // Verify password with bcrypt support
        const isValidPassword = await verifyPassword(password, admin.password_hash || '');
        
        if (!isValidPassword) {
          toast.error('Email ou senha incorretos');
          return;
        }

        // Store admin session in localStorage
        localStorage.setItem('restaurant_admin', JSON.stringify({
          id: admin.id,
          email: admin.email,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          is_owner: admin.is_owner,
          slug: restaurantSlug
        }));

        toast.success(`Bem-vindo ao painel de ${restaurant.name}!`);
        navigate(`/r/${restaurantSlug}/admin/dashboard`);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToMenu = () => {
    if (restaurantSlug) {
      navigate(`/r/${restaurantSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-warning rounded-full flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Entrar no Painel</h1>
          <p className="text-muted-foreground mt-2">
            {type === 'restaurant' 
              ? 'Acesse o painel do restaurante'
              : 'Acesse sua conta para gerenciar o sistema'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="delivery-input pl-12"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="delivery-input pl-12 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-right">
            <button type="button" className="text-sm text-primary hover:underline">
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="delivery-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-sm text-muted-foreground">
          Apenas usuários autorizados podem acessar o sistema.
          <br />
          Contas são criadas pelo revendedor.
        </p>

        {/* Back Link */}
        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao cardápio
        </button>
      </div>
    </div>
  );
};
