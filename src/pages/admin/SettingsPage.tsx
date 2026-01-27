import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Store, 
  Settings, 
  Palette, 
  MapPin, 
  Phone, 
  CreditCard, 
  Clock,
  ChevronDown,
  X,
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { PixKeyInput, isValidPixKey, PixKeyType } from '@/components/ui/pix-key-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useRestaurantAdmin } from '@/hooks/useRestaurantAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';
import { useStoreOpenSync, syncStoreStatusNow } from '@/hooks/useStoreOpenStatus';
import { broadcastStoreManualModeChange } from '@/lib/storeStatusMode';
import { broadcastStoreStatusChange } from '@/lib/storeStatusEvent';


const SettingsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant, refetch: refetchRestaurant } = useRestaurantBySlug(slug);
  const { 
    settings, 
    isLoading: isLoadingSettings, 
    updateSettings 
  } = useRestaurantSettings(restaurant?.id);

  // Store Status
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [storeStatusHydrated, setStoreStatusHydrated] = useState(false);

  // Sincronização automática com horários de funcionamento
  // Importante: só ativamos após hidratar o modo (manual/automático) vindo do banco,
  // para não sobrescrever o último status manual ao entrar na página.
  // Nota: não damos refetch do restaurante aqui para evitar loops de carregamento na página.
  useStoreOpenSync(storeStatusHydrated ? restaurant?.id : undefined, isManualMode, (newStatus) => {
    setIsStoreOpen(newStatus);
    if (restaurant?.id) {
      broadcastStoreStatusChange(restaurant.id, newStatus);
    }
  });
  
  // Branding
  const [restaurantName, setRestaurantName] = useState('');
  const [appName, setAppName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Address & Contact
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // PIX
  const [pixKeyType, setPixKeyType] = useState('phone');
  const [pixKey, setPixKey] = useState('');
  


  // Password change
  const { admin } = useRestaurantAdmin();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [samePasswordServerError, setSamePasswordServerError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Load restaurant data
  useEffect(() => {
    if (restaurant) {
      setIsStoreOpen(restaurant.is_open ?? false);
      setIsManualMode(restaurant.is_manual_mode ?? false);
      setStoreStatusHydrated(true);

      setRestaurantName(restaurant.name || '');
      setAddress(restaurant.address || '');
      setWhatsapp(restaurant.whatsapp || '');
      setLogoUrl(restaurant.logo || null);
      setBannerUrl(restaurant.banner || null);
    }
  }, [restaurant]);

  // Mantém Status/M. Manual sincronizados em tempo real (evita desencontro com a sidebar)
  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel(`settings-restaurant-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurant.id}`,
        },
        (payload) => {
          const next = payload.new as any;
          setIsStoreOpen(next?.is_open ?? false);
          setIsManualMode(next?.is_manual_mode ?? false);
          if (next?.name) setRestaurantName(next.name);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id]);

  // Load settings data
  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || 'Cardápio');
      setShortName(settings.short_name || 'Cardápio');
      setPixKeyType(settings.pix_key_type || 'phone');
      setPixKey(settings.pix_key || '');
    }
  }, [settings]);


  const handleToggleAutomaticMode = async (automatic: boolean) => {
    if (!restaurant?.id) return;

    const previousManual = isManualMode;
    const previousOpen = isStoreOpen;

    // automatic=true => is_manual_mode=false
    setIsManualMode(!automatic);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_manual_mode: !automatic })
        .eq('id', restaurant.id);

      if (error) throw error;

      broadcastStoreManualModeChange(restaurant.id, !automatic);

      if (automatic) {
        // Ao ativar automático, sincroniza imediatamente com horários
        setIsSyncingStatus(true);
        try {
          const newStatus = await syncStoreStatusNow(restaurant.id);
          setIsStoreOpen(newStatus);
          broadcastStoreStatusChange(restaurant.id, newStatus);
          toast.success('Modo automático ativado');
        } catch (syncError) {
          console.error('Error syncing status:', syncError);
          toast.error('Erro ao sincronizar status');
        } finally {
          setIsSyncingStatus(false);
        }
      } else {
        toast.success('Modo manual ativado');
      }
    } catch (error) {
      console.error('Error toggling automatic mode:', error);
      toast.error('Erro ao atualizar modo');
      setIsManualMode(previousManual);
      setIsStoreOpen(previousOpen);
    }
  };

  const handleToggleStoreOpen = async (open: boolean) => {
    if (!restaurant?.id) return;

    // Se estiver em automático, ao mexer aqui ativamos o modo manual primeiro.
    if (!isManualMode) {
      const previousManual = isManualMode;
      setIsManualMode(true);
      setIsSyncingStatus(true);

      try {
        const { error } = await supabase
          .from('restaurants')
          .update({ is_manual_mode: true })
          .eq('id', restaurant.id);

        if (error) throw error;

        broadcastStoreManualModeChange(restaurant.id, true);
        toast.success('Modo manual ativado');
      } catch (error) {
        console.error('Error enabling manual mode:', error);
        toast.error('Erro ao ativar modo manual');
        setIsManualMode(previousManual);
        return;
      } finally {
        setIsSyncingStatus(false);
      }
    }

    const previousOpen = isStoreOpen;
    setIsStoreOpen(open);

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: open })
        .eq('id', restaurant.id);

      if (error) throw error;

      broadcastStoreStatusChange(restaurant.id, open);
      toast.success(open ? 'Loja aberta!' : 'Loja fechada!');
    } catch (error) {
      console.error('Error updating store status:', error);
      toast.error('Erro ao atualizar status da loja');
      setIsStoreOpen(previousOpen);
    }
  };

  const handleSaveBranding = async () => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      // Update restaurant name, logo, and banner
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({ 
          name: restaurantName,
          logo: logoUrl,
          banner: bannerUrl,
        })
        .eq('id', restaurant.id);

      if (restaurantError) throw restaurantError;

      // Update settings
      await updateSettings({
        app_name: appName,
        short_name: shortName,
      });

      refetchRestaurant();
      toast.success('Personalização salva!');
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Erro ao salvar personalização');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    if (!restaurant) return;

    // Validate PIX key if provided
    if (pixKey) {
      const validation = isValidPixKey(pixKey, pixKeyType);
      if (!validation.valid) {
        toast.error(validation.message || 'Chave PIX inválida');
        return;
      }
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ 
          address,
          whatsapp,
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      await updateSettings({
        pix_key_type: pixKeyType,
        pix_key: pixKey,
      });

      refetchRestaurant();
      toast.success('Configurações de contato salvas!');
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };


  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurant) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `${restaurant.id}/logo-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success('Logo enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !restaurant) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `${restaurant.id}/banner-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setBannerUrl(publicUrl);
      toast.success('Banner enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Erro ao enviar banner');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const removeBanner = () => {
    setBannerUrl(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };


  const handleChangePassword = async () => {
    if (!admin) {
      toast.error('Você precisa estar logado para alterar a senha');
      return;
    }

    setSamePasswordServerError(false);

    if (!currentPassword) {
      toast.error('Preencha a senha atual');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Preencha a nova senha e confirmação');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword === currentPassword) {
      // validação local (UX)
      toast.error('A nova senha não pode ser igual à senha atual');
      return;
    }

    setIsChangingPassword(true);
    try {
      const normalizedEmail = admin.email.toLowerCase().trim();

      // Confirma a senha atual via autenticação (fonte de verdade)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: currentPassword,
      });

      if (reauthError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Atualiza a senha do usuário autenticado
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        const code = (updateError as any)?.code ?? (updateError as any)?.error_code;
        const msg = (updateError as any)?.message ?? '';

        if (code === 'same_password' || /different from the old password/i.test(msg)) {
          setSamePasswordServerError(true);
          toast.error('A nova senha não pode ser igual à senha atual');
          return;
        }

        throw updateError;
      }

      // (Opcional) mantém também um hash na tabela de admins, para validações internas futuras.
      // Não bloqueia a troca de senha caso falhe (por exemplo, por permissões).
      const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-password', {
        body: { action: 'hash', password: newPassword },
      });

      if (!hashError && hashData?.hash) {
        await supabase
          .from('restaurant_admins')
          .update({ password_hash: hashData.hash })
          .eq('id', admin.id);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      const msg = error?.message ?? '';
      const code = error?.code ?? error?.error_code;

      if (code === 'same_password' || /different from the old password/i.test(msg)) {
        setSamePasswordServerError(true);
        toast.error('A nova senha não pode ser igual à senha atual');
        return;
      }

      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };


  const storeStatusSubtitle =
    isManualMode
      ? 'Manual: você controla abrir/fechar'
      : 'Automático: segue os horários';

  const isLoading = isLoadingRestaurant || isLoadingSettings;

  if (isLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-8 max-w-2xl">
        {/* Store Status Section */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-4">
          {/* Status da Loja - informativo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isStoreOpen ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <Store className={`w-5 h-5 ${isStoreOpen ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Status da Loja</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isStoreOpen 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {isStoreOpen ? 'Aberta' : 'Fechada'}
                  </span>
                  {isSyncingStatus && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{storeStatusSubtitle}</p>
              </div>
            </div>
            {/* Toggle para abrir/fechar só aparece quando em modo manual */}
            {isManualMode && (
              <Switch
                checked={isStoreOpen}
                onCheckedChange={handleToggleStoreOpen}
                disabled={isSyncingStatus}
              />
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-border" />

          {/* Controle Manual - ativa/desativa modo manual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isManualMode ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'
              }`}>
                <Settings className={`w-5 h-5 ${isManualMode ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <span className="font-medium text-foreground">Controle Manual</span>
                <p className="text-sm text-muted-foreground">
                  {isManualMode ? 'Você controla quando abrir/fechar' : 'Segue os horários de funcionamento'}
                </p>
              </div>
            </div>
            <Switch
              checked={isManualMode}
              onCheckedChange={(checked) => handleToggleAutomaticMode(!checked)}
              disabled={isSyncingStatus}
            />
          </div>

        </div>

        {/* Branding Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Personalização da Marca</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Nome do Restaurante</label>
              <Input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Logo (também será o ícone do app instalado)</label>
              <div className="relative">
                {logoUrl ? (
                  <div className="w-full h-40 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
                    <button 
                      onClick={removeLogo}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Clique para enviar</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Recomendado: imagem quadrada de pelo menos 512x512 pixels</p>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Banner (capa do cardápio)</label>
              <div className="relative">
                {bannerUrl ? (
                  <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <button 
                      onClick={removeBanner}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                  >
                    {isUploadingBanner ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Clique para enviar o banner</span>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Recomendado: imagem horizontal de pelo menos 1200x400 pixels</p>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Preview</label>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-800 to-amber-950 rounded-xl flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Preview" className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">🍔</span>
                  )}
                </div>
                <span className="font-semibold text-foreground">{restaurantName || 'Nome do Restaurante'}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-4">Configurações do App Instalável (PWA)</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Nome do App (exibido na tela inicial)</label>
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Nome Curto (abaixo do ícone)</label>
                  <Input
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Aparece abaixo do ícone quando o app é instalado</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveBranding}
              disabled={isSaving}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Personalização
            </Button>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Endereço</h2>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Endereço completo</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Será exibido no cardápio para os clientes</p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Contato</h2>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">WhatsApp</label>
            <PhoneInput
              value={whatsapp}
              onChange={setWhatsapp}
            />
            <p className="text-xs text-muted-foreground mt-1">Número com DDD para contato via WhatsApp</p>
          </div>
        </div>

        {/* PIX Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Chave PIX</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Tipo da Chave</label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="random">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm text-muted-foreground">Chave PIX</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium mb-1">Formato esperado:</p>
                      {pixKeyType === 'phone' && <p className="text-sm">(00) 00000-0000 ou (00) 0000-0000</p>}
                      {pixKeyType === 'cpf' && <p className="text-sm">000.000.000-00</p>}
                      {pixKeyType === 'cnpj' && <p className="text-sm">00.000.000/0000-00</p>}
                      {pixKeyType === 'email' && <p className="text-sm">exemplo@email.com</p>}
                      {pixKeyType === 'random' && <p className="text-sm">Chave aleatória gerada pelo banco</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <PixKeyInput
                  value={pixKey}
                  onChange={setPixKey}
                  keyType={pixKeyType}
                  onTypeDetected={(detectedType: PixKeyType) => {
                    setPixKeyType(detectedType);
                    toast.success(`Tipo detectado: ${
                      detectedType === 'phone' ? 'Telefone' :
                      detectedType === 'cpf' ? 'CPF' :
                      detectedType === 'cnpj' ? 'CNPJ' :
                      detectedType === 'email' ? 'E-mail' : 'Aleatória'
                    }`);
                  }}
                  className={pixKey ? (isValidPixKey(pixKey, pixKeyType).valid ? 'border-green-500 pr-10' : 'border-destructive pr-10') : ''}
                />
                {pixKey && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidPixKey(pixKey, pixKeyType).valid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {pixKey && !isValidPixKey(pixKey, pixKeyType).valid && (
                <p className="text-sm text-destructive mt-1">
                  {isValidPixKey(pixKey, pixKeyType).message}
                </p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSaveContact}
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Contato e PIX
          </Button>
        </div>



        {/* Password Change Section - Only for restaurant admins */}
        {admin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">Alterar Senha</h2>
            </div>

            <div className="space-y-4 p-4 bg-card border border-border rounded-xl">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Senha Atual</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (samePasswordServerError) setSamePasswordServerError(false);
                    }}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Nova Senha</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (samePasswordServerError) setSamePasswordServerError(false);
                    }}
                    placeholder="Digite a nova senha (mínimo 6 caracteres)"
                    className={
                      currentPassword && newPassword && (newPassword === currentPassword || samePasswordServerError)
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {currentPassword && newPassword && (newPassword === currentPassword || samePasswordServerError) && (
                  <p className="text-sm text-destructive mt-1">A nova senha não pode ser igual à senha atual</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Confirmar Nova Senha</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className={
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive mt-1">As senhas não coincidem</p>
                )}
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  newPassword === currentPassword ||
                  samePasswordServerError
                }
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Alterar Senha
              </Button>
            </div>
          </div>
        )}
      </div>

    </AdminLayout>
  );
};

export default SettingsPage;
