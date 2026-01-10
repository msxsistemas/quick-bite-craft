import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - replace with actual auth later
    setTimeout(() => {
      setIsLoading(false);
      if (type === 'reseller') {
        navigate('/reseller/dashboard');
      } else {
        navigate(`/r/${restaurantSlug}/admin/dashboard`);
      }
    }, 1000);
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
            Acesse sua conta para gerenciar o sistema
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
            className="delivery-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
