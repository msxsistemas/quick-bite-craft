import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Palette, 
  FileText, 
  Star, 
  Package, 
  XCircle, 
  Link as LinkIcon, 
  Copy,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/app-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
}

const menuItems: MenuItem[] = [
  { id: 'configuracoes', title: 'Configurações', icon: <Settings className="w-4 h-4" />, description: 'Configurações gerais do cardápio' },
  { id: 'cor-capa', title: 'Cor e capa da loja', icon: <Palette className="w-4 h-4" />, description: 'Personalize cores e banner' },
  { id: 'descricao-rodape', title: 'Descrição e Rodapé', icon: <FileText className="w-4 h-4" />, description: 'Edite descrições e rodapé' },
  { id: 'destaques', title: 'Produtos em destaque', icon: <Star className="w-4 h-4" />, description: 'Configure produtos em destaque' },
  { id: 'descartaveis', title: 'Adicionar descartáveis', icon: <Package className="w-4 h-4" />, description: 'Gerencie itens descartáveis' },
  { id: 'esgotados', title: 'Produtos esgotados', icon: <XCircle className="w-4 h-4" />, description: 'Gerencie produtos sem estoque' },
  { id: 'link-cardapio', title: 'Link do Cardápio', icon: <LinkIcon className="w-4 h-4" />, description: 'Copie e compartilhe seu link' },
  { id: 'clonagem-ifood', title: 'Clonagem de cardápio iFood', icon: <Copy className="w-4 h-4" />, description: 'Importe cardápio do iFood' },
];

export default function MenuManagerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  const [activeSection, setActiveSection] = useState('clonagem-ifood');
  const [importMethod, setImportMethod] = useState<'cnpj' | 'link'>('link');
  const [ifoodLink, setIfoodLink] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  const handleCloneMenu = async () => {
    if (importMethod === 'link' && !ifoodLink) {
      toast.error('Por favor, insira o link do cardápio iFood');
      return;
    }
    if (importMethod === 'cnpj' && !cnpj) {
      toast.error('Por favor, insira o CNPJ');
      return;
    }

    setIsCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke('clone-ifood-menu', {
        body: {
          restaurant_id: restaurant?.id,
          method: importMethod,
          ifood_link: importMethod === 'link' ? ifoodLink : undefined,
          cnpj: importMethod === 'cnpj' ? cnpj : undefined,
          discount_percent: discountPercent ? parseFloat(discountPercent) : 0,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Cardápio clonado com sucesso! ${data.products_count || 0} produtos importados.`);
        setIfoodLink('');
        setCnpj('');
        setDiscountPercent('');
      } else {
        throw new Error(data?.error || 'Erro ao clonar cardápio');
      }
    } catch (error: any) {
      console.error('Error cloning menu:', error);
      toast.error(error.message || 'Erro ao clonar cardápio. Verifique o link e tente novamente.');
    } finally {
      setIsCloning(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'configuracoes':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Configure as opções gerais do seu cardápio digital</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Acesse as <Link to={`/r/${slug}/admin/settings`} className="text-primary underline">configurações gerais</Link> para editar as informações do restaurante.
              </p>
            </CardContent>
          </Card>
        );

      case 'cor-capa':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Cor e capa da loja</CardTitle>
              <CardDescription>Personalize as cores e o banner do seu cardápio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Acesse as <Link to={`/r/${slug}/admin/settings`} className="text-primary underline">configurações</Link> para alterar logo e banner.
              </p>
            </CardContent>
          </Card>
        );

      case 'descricao-rodape':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Descrição e Rodapé</CardTitle>
              <CardDescription>Edite a descrição e rodapé do seu cardápio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em breve você poderá editar a descrição e rodapé aqui.</p>
            </CardContent>
          </Card>
        );

      case 'destaques':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Produtos em destaque</CardTitle>
              <CardDescription>Configure quais produtos aparecem em destaque</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Acesse a página de <Link to={`/r/${slug}/admin/products`} className="text-primary underline">produtos</Link> para marcar itens como destaque.
              </p>
            </CardContent>
          </Card>
        );

      case 'descartaveis':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar descartáveis</CardTitle>
              <CardDescription>Configure itens descartáveis opcionais</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use os <Link to={`/r/${slug}/admin/extras`} className="text-primary underline">acréscimos</Link> para criar grupos de descartáveis.
              </p>
            </CardContent>
          </Card>
        );

      case 'esgotados':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Produtos esgotados</CardTitle>
              <CardDescription>Gerencie produtos sem estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Acesse a página de <Link to={`/r/${slug}/admin/products`} className="text-primary underline">produtos</Link> para marcar itens como esgotados.
              </p>
            </CardContent>
          </Card>
        );

      case 'link-cardapio':
        const menuLink = `${window.location.origin}/r/${slug}`;
        return (
          <Card>
            <CardHeader>
              <CardTitle>Link do Cardápio</CardTitle>
              <CardDescription>Compartilhe seu cardápio digital com seus clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={menuLink} readOnly className="flex-1" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(menuLink);
                    toast.success('Link copiado!');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <Button variant="outline" asChild>
                <a href={menuLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir cardápio
                </a>
              </Button>
            </CardContent>
          </Card>
        );

      case 'clonagem-ifood':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Clonagem de cardápio iFood</CardTitle>
              <CardDescription>Importe grátis seus itens e adicionais do iFood de forma rápida e fácil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Seu cardápio atual será excluído e substituído pelo clonado
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <RadioGroup value={importMethod} onValueChange={(v) => setImportMethod(v as 'cnpj' | 'link')}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cnpj" id="cnpj" />
                        <Label htmlFor="cnpj">CNPJ</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="link" id="link" />
                        <Label htmlFor="link">Link do cardápio iFood</Label>
                      </div>
                    </div>
                  </RadioGroup>

                  {importMethod === 'link' ? (
                    <div className="space-y-2">
                      <Label htmlFor="ifood-link">Link do seu cardápio iFood *</Label>
                      <Input
                        id="ifood-link"
                        placeholder="Ex.: https://www.ifood.com.br/delivery/restaurante"
                        value={ifoodLink}
                        onChange={(e) => setIfoodLink(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="cnpj-input">CNPJ do restaurante *</Label>
                      <Input
                        id="cnpj-input"
                        placeholder="00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="discount">Diminuir valores em %</Label>
                    <Input
                      id="discount"
                      placeholder="Ex.: 10"
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleCloneMenu}
                    disabled={isCloning}
                  >
                    {isCloning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Clonando...
                      </>
                    ) : (
                      'Clonar cardápio'
                    )}
                  </Button>
                </div>

                <div className="hidden lg:flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="w-24 h-40 bg-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                        iFood
                      </div>
                      <div className="text-3xl text-muted-foreground/50">→</div>
                      <div className="w-24 h-40 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-sm">
                        Seu App
                      </div>
                    </div>
                    <p className="text-sm">Importe seu cardápio em segundos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Gestor de Cardápio</h1>
          <p className="text-muted-foreground">Gerencie todas as configurações do seu cardápio digital</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {menuItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="text-muted-foreground/70">{index + 1}.</span>
                    <span>{item.title}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
