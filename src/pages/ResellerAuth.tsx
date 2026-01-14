import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ResellerAuth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading: authLoading, isReseller } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in as reseller
  useEffect(() => {
    if (!authLoading && user && isReseller) {
      navigate('/reseller/dashboard');
    }
  }, [user, isReseller, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else if (error.message.toLowerCase().includes('email not confirmed')) {
            toast.error('Confirme seu email antes de entrar.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Login realizado com sucesso!');
        navigate('/reseller/dashboard', { replace: true });
      } else {
        if (!name.trim()) {
          toast.error('Por favor, informe seu nome');
          return;
        }
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }

        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Conta criada com sucesso!');
        navigate('/reseller/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-warning rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <UtensilsCrossed className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Entrar como Revendedor' : 'Criar conta de Revendedor'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin 
              ? 'Acesse sua conta para gerenciar seus restaurantes' 
              : 'Crie sua conta para começar a gerenciar restaurantes'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="delivery-input pl-12"
                required={!isLogin}
              />
            </div>
          )}

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
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="delivery-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              isLogin ? 'Entrar' : 'Criar conta'
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-primary hover:underline font-medium"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>

        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default ResellerAuth;
