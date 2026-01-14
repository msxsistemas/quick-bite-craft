// WhatsApp Page - Updated with real WhatsApp icon
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { 
  CreditCard, 
  CheckCircle, 
  Truck, 
  Gift,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  Eye
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Default WhatsApp messages
const DEFAULT_WHATSAPP_MESSAGES = {
  pix: `Olá {nome}! 🍔

Pedido #{pedido} recebido!

Total: {total}

💠 Chave Pix: {chave_pix} ({tipo_chave})

Aguardamos o comprovante para iniciar o preparo!`,
  accepted: `Olá {nome}, seu pedido foi confirmado e está sendo preparado 😋

*Pedido: #{pedido}*
-------------------------------
📦 *Produtos*
{produtos}

{subtotal} Total dos produtos
{taxa_entrega} Taxa de entrega
*{total} Total*

Forma de pagamento: {forma_pagamento}
{status_pagamento}
-------------------------------
👤 Nome: {nome}
📍 Bairro: {bairro}
🏠 Rua: {rua}
🔢 Número: {numero}
{complemento}⏱ Previsão de entrega: {previsao}

Obrigado pela preferência 😊`,
  delivery: `Olá, {nome}! 🛵

Seu pedido #{pedido} saiu para entrega!

Em breve chegará até você! 📍`,
  delivered: `Olá {nome}! 🎉

Seu pedido #{pedido} foi entregue com sucesso!

Obrigado pela preferência! ❤️
Esperamos você novamente em breve!`,
};

// Example values for preview
const PREVIEW_VALUES = {
  nome: 'João Silva',
  pedido: '1234',
  total: 'R$ 45,90',
  subtotal: 'R$ 39,90',
  taxa_entrega: 'R$ 6,00',
  chave_pix: '11999999999',
  tipo_chave: 'Telefone',
  produtos: '2x X-Burguer\n1x Batata Frita',
  forma_pagamento: 'PIX',
  status_pagamento: '✅ Pago',
  bairro: 'Centro',
  rua: 'Rua das Flores',
  numero: '123',
  complemento: '🏢 Complemento: Apto 45\n',
  previsao: '30-45 min',
};

const WhatsAppPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  const { settings, refetch: refetchSettings } = useRestaurantSettings(restaurant?.id);
  
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [whatsappMessages, setWhatsappMessages] = useState({
    pix: DEFAULT_WHATSAPP_MESSAGES.pix,
    accepted: DEFAULT_WHATSAPP_MESSAGES.accepted,
    delivery: DEFAULT_WHATSAPP_MESSAGES.delivery,
    delivered: DEFAULT_WHATSAPP_MESSAGES.delivered,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings data
  useEffect(() => {
    if (settings) {
      setWhatsappMessages({
        pix: settings.whatsapp_msg_pix || DEFAULT_WHATSAPP_MESSAGES.pix,
        accepted: settings.whatsapp_msg_accepted || DEFAULT_WHATSAPP_MESSAGES.accepted,
        delivery: settings.whatsapp_msg_delivery || DEFAULT_WHATSAPP_MESSAGES.delivery,
        delivered: settings.whatsapp_msg_delivered || DEFAULT_WHATSAPP_MESSAGES.delivered,
      });
    }
  }, [settings]);

  const formatPreview = (message: string) => {
    let formatted = message;
    Object.entries(PREVIEW_VALUES).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return formatted;
  };

  const handleSaveMessages = async () => {
    if (!restaurant?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurant_settings')
        .update({
          whatsapp_msg_pix: whatsappMessages.pix,
          whatsapp_msg_accepted: whatsappMessages.accepted,
          whatsapp_msg_delivery: whatsappMessages.delivery,
          whatsapp_msg_delivered: whatsappMessages.delivered,
        })
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;

      toast.success('Mensagens salvas com sucesso!');
      refetchSettings();
    } catch (error) {
      console.error('Error saving messages:', error);
      toast.error('Erro ao salvar mensagens');
    } finally {
      setIsSaving(false);
    }
  };

  const whatsappMessageTypes = [
    { 
      id: 'pix', 
      label: '💠 Cobrança PIX', 
      icon: CreditCard,
      description: 'Enviada quando o cliente escolhe pagar via PIX',
      variables: '{nome}, {pedido}, {total}, {chave_pix}, {tipo_chave}'
    },
    { 
      id: 'accepted', 
      label: '✅ Pedido Aceito', 
      icon: CheckCircle,
      description: 'Enviada quando o pedido é confirmado',
      variables: '{nome}, {pedido}, {produtos}, {subtotal}, {taxa_entrega}, {total}, {forma_pagamento}, {status_pagamento}, {bairro}, {rua}, {numero}, {complemento}, {previsao}'
    },
    { 
      id: 'delivery', 
      label: '🛵 Saiu para Entrega', 
      icon: Truck,
      description: 'Enviada quando o pedido sai para entrega',
      variables: '{nome}, {pedido}'
    },
    { 
      id: 'delivered', 
      label: '🎉 Pedido Entregue', 
      icon: Gift,
      description: 'Enviada quando o pedido é entregue',
      variables: '{nome}, {pedido}'
    },
  ];

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <WhatsAppIcon className="w-8 h-8 text-[#25D366]" />
              Mensagens WhatsApp
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure mensagens personalizadas para enviar ao cliente em cada fase do pedido
            </p>
          </div>
          <Button 
            onClick={handleSaveMessages} 
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Mensagens'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensagens por Fase do Pedido</CardTitle>
            <CardDescription>
              Use variáveis entre chaves para personalizar as mensagens. Ex: {'{nome}'} será substituído pelo nome do cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {whatsappMessageTypes.map((message) => (
              <Collapsible 
                key={message.id}
                open={expandedMessage === message.id}
                onOpenChange={(open) => setExpandedMessage(open ? message.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <message.icon className="w-5 h-5 text-primary" />
                      <div>
                        <span className="font-medium">{message.label}</span>
                        <p className="text-xs text-muted-foreground">{message.description}</p>
                      </div>
                    </div>
                    {expandedMessage === message.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20 ml-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        <strong>Variáveis disponíveis:</strong> {message.variables}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPreview(showPreview === message.id ? null : message.id);
                          }}
                          className="text-xs gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {showPreview === message.id ? 'Ocultar Preview' : 'Ver Preview'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhatsappMessages(prev => ({
                              ...prev,
                              [message.id]: DEFAULT_WHATSAPP_MESSAGES[message.id as keyof typeof DEFAULT_WHATSAPP_MESSAGES]
                            }));
                          }}
                          className="text-xs gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restaurar padrão
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={whatsappMessages[message.id as keyof typeof whatsappMessages]}
                      onChange={(e) => setWhatsappMessages(prev => ({
                        ...prev,
                        [message.id]: e.target.value
                      }))}
                      placeholder={`Mensagem para ${message.label.toLowerCase()}...`}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    {showPreview === message.id && (
                      <div className="bg-muted/50 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">📱 Preview da mensagem:</p>
                        <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
                          {formatPreview(whatsappMessages[message.id as keyof typeof whatsappMessages])}
                        </pre>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WhatsAppPage;
