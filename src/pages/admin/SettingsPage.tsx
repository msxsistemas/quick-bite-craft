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
  Send, 
  Clock,
  ChevronDown,
  X,
  CheckSquare,
  Truck,
  Package,
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { PixKeyInput, isValidPixKey } from '@/components/ui/pix-key-input';
import { Textarea } from '@/components/ui/textarea';
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
import { useRestaurantSettings, getDayName } from '@/hooks/useRestaurantSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant, refetch: refetchRestaurant } = useRestaurantBySlug(slug);
  const { 
    settings, 
    operatingHours, 
    isLoading: isLoadingSettings, 
    updateSettings, 
    updateOperatingHour, 
    toggleDayActive 
  } = useRestaurantSettings(restaurant?.id);

  // Store Status
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Branding
  const [restaurantName, setRestaurantName] = useState('');
  const [appName, setAppName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Address & Contact
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // PIX
  const [pixKeyType, setPixKeyType] = useState('phone');
  const [pixKey, setPixKey] = useState('');
  
  // WhatsApp Messages
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState({
    pix: '',
    accepted: '',
    delivery: '',
    delivered: '',
  });

  // Schedule editing
  const [editingHour, setEditingHour] = useState<typeof operatingHours[0] | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Load restaurant data
  useEffect(() => {
    if (restaurant) {
      setIsStoreOpen(restaurant.is_open ?? false);
      setRestaurantName(restaurant.name || '');
      setAddress(restaurant.address || '');
      setWhatsapp(restaurant.whatsapp || '');
      setLogoUrl(restaurant.logo || null);
    }
  }, [restaurant]);

  // Load settings data
  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || 'Cardápio');
      setShortName(settings.short_name || 'Cardápio');
      setPixKeyType(settings.pix_key_type || 'phone');
      setPixKey(settings.pix_key || '');
      setWhatsappMessages({
        pix: settings.whatsapp_msg_pix || '',
        accepted: settings.whatsapp_msg_accepted || '',
        delivery: settings.whatsapp_msg_delivery || '',
        delivered: settings.whatsapp_msg_delivered || '',
      });
    }
  }, [settings]);

  const handleToggleStoreOpen = async (open: boolean) => {
    if (!restaurant) return;
    
    setIsStoreOpen(open);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_open: open })
        .eq('id', restaurant.id);

      if (error) throw error;
      toast.success(open ? 'Loja aberta!' : 'Loja fechada!');
    } catch (error) {
      console.error('Error updating store status:', error);
      toast.error('Erro ao atualizar status da loja');
      setIsStoreOpen(!open);
    }
  };

  const handleSaveBranding = async () => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      // Update restaurant name and logo
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({ 
          name: restaurantName,
          logo: logoUrl,
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

  const handleSaveWhatsappMessages = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        whatsapp_msg_pix: whatsappMessages.pix,
        whatsapp_msg_accepted: whatsappMessages.accepted,
        whatsapp_msg_delivery: whatsappMessages.delivery,
        whatsapp_msg_delivered: whatsappMessages.delivered,
      });
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

  const openEditHourModal = (hour: typeof operatingHours[0]) => {
    setEditingHour(hour);
    setEditStartTime(hour.start_time.slice(0, 5));
    setEditEndTime(hour.end_time.slice(0, 5));
  };

  const handleSaveHour = async () => {
    if (!editingHour) return;

    await updateOperatingHour(editingHour.id, {
      start_time: editStartTime,
      end_time: editEndTime,
    });
    setEditingHour(null);
    toast.success('Horário atualizado!');
  };

  const messageConfig = [
    { id: 'pix', label: 'Cobrança PIX', icon: CreditCard },
    { id: 'accepted', label: 'Pedido Aceito', icon: CheckSquare },
    { id: 'delivery', label: 'Saiu para Entrega', icon: Truck },
    { id: 'delivered', label: 'Pedido Entregue', icon: Package },
  ];

  // Get today's schedule
  const today = new Date().getDay();
  const todaySchedule = operatingHours.find(h => h.day_of_week === today);

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
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
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
                </div>
                <p className="text-sm text-muted-foreground">Sincronizado com horários de funcionamento</p>
              </div>
            </div>
            <Switch
              checked={isStoreOpen}
              onCheckedChange={handleToggleStoreOpen}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium text-foreground">Modo Manual</span>
                <p className="text-xs text-muted-foreground">Ativar para abrir/fechar manualmente</p>
              </div>
            </div>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
          </div>

          {todaySchedule && (
            <p className="text-sm text-muted-foreground px-4">
              Hoje ({getDayName(todaySchedule.day_of_week)}): {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
            </p>
          )}
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

        {/* WhatsApp Messages Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Mensagens WhatsApp por Fase</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure mensagens personalizadas para enviar ao cliente em cada fase do pedido via WhatsApp.
          </p>

          <div className="space-y-2">
            {messageConfig.map((message) => (
              <div key={message.id}>
                <button
                  onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                  className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <message.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{message.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedMessage === message.id ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {expandedMessage === message.id && (
                  <div className="p-4 bg-muted/20 border-b border-border">
                    <Textarea
                      placeholder={`Mensagem para ${message.label.toLowerCase()}...`}
                      value={whatsappMessages[message.id as keyof typeof whatsappMessages]}
                      onChange={(e) => setWhatsappMessages(prev => ({
                        ...prev,
                        [message.id]: e.target.value
                      }))}
                      rows={4}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSaveWhatsappMessages}
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Configurações
          </Button>
        </div>

        {/* Operating Hours Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Horários de Funcionamento</h2>
          </div>

          <div className="space-y-2">
            {operatingHours.map((hour) => (
              <div
                key={hour.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={hour.active}
                    onCheckedChange={() => toggleDayActive(hour.id)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <span className={`font-medium ${hour.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {getDayName(hour.day_of_week)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {hour.start_time.slice(0, 5)} - {hour.end_time.slice(0, 5)}
                  </span>
                  <button 
                    onClick={() => openEditHourModal(hour)}
                    className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Hour Modal */}
      <Dialog open={!!editingHour} onOpenChange={() => setEditingHour(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar Horário - {editingHour ? getDayName(editingHour.day_of_week) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de Abertura</Label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Fechamento</Label>
                <Input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingHour(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveHour}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SettingsPage;
