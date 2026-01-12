import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Palette, Tag, CreditCard, Save, Plus, Pencil, Trash2, Copy, ExternalLink, Store } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const ResellerSettingsPage = () => {
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'Demo',
    companyName: 'Pediu Chegou',
    email: 'demo@gmail.com',
    phone: '99999999999',
  });

  const [colors, setColors] = useState({
    primary: '#FF9500',
    secondary: '#1E57DC',
  });

  const [mercadoPago, setMercadoPago] = useState({
    enabled: false,
    accessToken: '',
    publicKey: '',
  });

  const plans = [
    { id: '1', name: 'Plano Básico', description: 'Até 20 produtos.', price: 99.90 },
  ];

  const webhookUrl = 'https://xeylzabmxuggprfpgsjg.supabase.co/functions/v1/mercadopago-webhook';

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas informações e integrações</p>
        </div>

        {/* Personal Info */}
        <div className="delivery-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Informações Pessoais</h2>
          <p className="text-sm text-muted-foreground mb-6">Atualize suas informações de contato e empresa</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome Completo</label>
              <input
                type="text"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome da Empresa</label>
              <input
                type="text"
                value={personalInfo.companyName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, companyName: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
              <input
                type="text"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

        {/* System Colors */}
        <div className="delivery-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Cores do Sistema</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Defina as cores que serão aplicadas ao painel de revendedor e a todos os restaurantes</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cor Principal</label>
              <p className="text-xs text-muted-foreground mb-3">Botões, destaques e elementos principais</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-14 h-14 rounded-lg border border-border cursor-pointer"
                  style={{ backgroundColor: colors.primary }}
                />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Código Hex</label>
                  <input
                    type="text"
                    value={colors.primary}
                    onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                    className="w-32 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cor Secundária</label>
              <p className="text-xs text-muted-foreground mb-3">Status de sucesso e elementos secundários</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-14 h-14 rounded-lg border border-border cursor-pointer"
                  style={{ backgroundColor: colors.secondary }}
                />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Código Hex</label>
                  <input
                    type="text"
                    value={colors.secondary}
                    onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                    className="w-32 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">Preview em Tempo Real</label>
            <div className="border border-border rounded-xl p-6 bg-muted/30">
              <div className="mb-4">
                <label className="block text-xs text-muted-foreground mb-2">Botões</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Botão Primário
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    Botão Secundário
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg border-2 text-sm font-medium"
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    Outline
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-muted-foreground mb-2">Badges</label>
                <div className="flex flex-wrap gap-2">
                  <span 
                    className="px-2 py-0.5 rounded text-xs text-white font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Em Teste
                  </span>
                  <span 
                    className="px-2 py-0.5 rounded text-xs text-white font-medium"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    Aberto
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white font-medium">
                    Fechado
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-2">Header do Cardápio</label>
                <div className="border border-border rounded-xl p-4 bg-background">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Burger House</span>
                        <span 
                          className="px-2 py-0.5 rounded text-xs text-white font-medium"
                          style={{ backgroundColor: colors.secondary }}
                        >
                          Aberto
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">Entrega • 30-45 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            className="w-full py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            Salvar Cores
          </button>
        </div>

        {/* Subscription Plans */}
        <div className="delivery-card p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Planos de Assinatura</h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Novo Plano
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Defina os planos e preços para seus restaurantes</p>

          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <p className="text-sm font-medium text-primary mt-1">
                    R$ {plan.price.toFixed(2).replace('.', ',')}/mês
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mercado Pago Integration */}
        <div className="delivery-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-foreground">Integração Mercado Pago</h2>
            <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground font-medium">
              Inativo
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Configure para automatizar cobranças de assinaturas</p>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div>
                <p className="font-medium text-foreground">Ativar integração</p>
                <p className="text-sm text-muted-foreground">Habilita cobranças automáticas via Mercado Pago</p>
              </div>
              <Switch
                checked={mercadoPago.enabled}
                onCheckedChange={(checked) => setMercadoPago({ ...mercadoPago, enabled: checked })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Access Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="APP_USR-..."
                  value={mercadoPago.accessToken}
                  onChange={(e) => setMercadoPago({ ...mercadoPago, accessToken: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button className="px-4 py-2.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  Testar
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Obtenha em: Mercado Pago → Seu negócio → Configurações → Credenciais
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Public Key <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="APP_USR-..."
                value={mercadoPago.publicKey}
                onChange={(e) => setMercadoPago({ ...mercadoPago, publicKey: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-xl">
              <label className="block text-sm font-medium text-foreground mb-1.5">URL do Webhook</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  className="p-2.5 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Configure esta URL no painel do Mercado Pago para receber notificações automáticas.
              </p>
              <a 
                href="https://www.mercadopago.com.br/developers/panel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                Abrir painel do Mercado Pago
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerSettingsPage;
