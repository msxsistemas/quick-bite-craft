import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiData {
  emoji: string;
  name: string;
  keywords: string[];
}

const EMOJIS: EmojiData[] = [
  // Food & Drink
  { emoji: '🍔', name: 'hambúrguer', keywords: ['burger', 'hamburger', 'lanche', 'fast food'] },
  { emoji: '🍕', name: 'pizza', keywords: ['pizza', 'italiano', 'fatia'] },
  { emoji: '🌭', name: 'cachorro quente', keywords: ['hot dog', 'salsicha', 'lanche'] },
  { emoji: '🍟', name: 'batata frita', keywords: ['french fries', 'batata', 'fritas'] },
  { emoji: '🍿', name: 'pipoca', keywords: ['popcorn', 'cinema'] },
  { emoji: '🧂', name: 'sal', keywords: ['salt', 'tempero'] },
  { emoji: '🥓', name: 'bacon', keywords: ['bacon', 'carne', 'porco'] },
  { emoji: '🍖', name: 'carne no osso', keywords: ['meat', 'carne', 'churrasco'] },
  { emoji: '🍗', name: 'frango', keywords: ['chicken', 'coxa', 'asa'] },
  { emoji: '🥩', name: 'bife', keywords: ['steak', 'carne', 'boi'] },
  { emoji: '🥪', name: 'sanduíche', keywords: ['sandwich', 'lanche', 'pão'] },
  { emoji: '🌮', name: 'taco', keywords: ['taco', 'mexicano'] },
  { emoji: '🌯', name: 'burrito', keywords: ['burrito', 'mexicano', 'wrap'] },
  { emoji: '🥙', name: 'kebab', keywords: ['kebab', 'pita', 'árabe'] },
  { emoji: '🧆', name: 'falafel', keywords: ['falafel', 'árabe', 'vegano'] },
  { emoji: '🥚', name: 'ovo', keywords: ['egg', 'ovo'] },
  { emoji: '🍳', name: 'ovo frito', keywords: ['fried egg', 'frigideira', 'café da manhã'] },
  { emoji: '🥘', name: 'paella', keywords: ['paella', 'panela', 'arroz'] },
  { emoji: '🍲', name: 'cozido', keywords: ['stew', 'sopa', 'panela'] },
  { emoji: '🫕', name: 'fondue', keywords: ['fondue', 'queijo', 'chocolate'] },
  { emoji: '🥣', name: 'cereal', keywords: ['cereal', 'tigela', 'café da manhã'] },
  { emoji: '🥗', name: 'salada', keywords: ['salad', 'verde', 'saudável', 'fit'] },
  { emoji: '🍝', name: 'espaguete', keywords: ['spaghetti', 'macarrão', 'pasta', 'italiano'] },
  { emoji: '🍜', name: 'ramen', keywords: ['ramen', 'noodles', 'japonês', 'lámen'] },
  { emoji: '🍛', name: 'curry', keywords: ['curry', 'arroz', 'indiano'] },
  { emoji: '🍣', name: 'sushi', keywords: ['sushi', 'japonês', 'peixe'] },
  { emoji: '🍱', name: 'bentô', keywords: ['bento', 'japonês', 'marmita'] },
  { emoji: '🥟', name: 'gyoza', keywords: ['dumpling', 'gyoza', 'pastel', 'chinês'] },
  { emoji: '🥠', name: 'biscoito da sorte', keywords: ['fortune cookie', 'chinês'] },
  { emoji: '🥡', name: 'caixa de comida', keywords: ['takeout', 'delivery', 'chinês'] },
  { emoji: '🦪', name: 'ostra', keywords: ['oyster', 'frutos do mar'] },
  { emoji: '🍤', name: 'camarão', keywords: ['shrimp', 'frutos do mar', 'frito'] },
  { emoji: '🍙', name: 'onigiri', keywords: ['rice ball', 'arroz', 'japonês'] },
  { emoji: '🍚', name: 'arroz', keywords: ['rice', 'arroz branco'] },
  { emoji: '🍘', name: 'biscoito de arroz', keywords: ['rice cracker', 'japonês'] },
  { emoji: '🍥', name: 'naruto', keywords: ['fish cake', 'ramen', 'japonês'] },
  { emoji: '🥮', name: 'bolo da lua', keywords: ['moon cake', 'chinês'] },
  { emoji: '🍢', name: 'oden', keywords: ['oden', 'espeto', 'japonês'] },
  { emoji: '🍡', name: 'dango', keywords: ['dango', 'doce', 'japonês'] },
  { emoji: '🍧', name: 'raspadinha', keywords: ['shaved ice', 'gelo', 'verão'] },
  { emoji: '🍨', name: 'sorvete', keywords: ['ice cream', 'gelato', 'sobremesa'] },
  { emoji: '🍦', name: 'casquinha', keywords: ['soft serve', 'sorvete', 'cone'] },
  { emoji: '🥧', name: 'torta', keywords: ['pie', 'torta', 'sobremesa'] },
  { emoji: '🧁', name: 'cupcake', keywords: ['cupcake', 'bolinho', 'doce'] },
  { emoji: '🍰', name: 'bolo', keywords: ['cake', 'fatia', 'sobremesa', 'aniversário'] },
  { emoji: '🎂', name: 'bolo de aniversário', keywords: ['birthday cake', 'festa', 'vela'] },
  { emoji: '🍮', name: 'pudim', keywords: ['pudding', 'flan', 'sobremesa'] },
  { emoji: '🍭', name: 'pirulito', keywords: ['lollipop', 'doce', 'candy'] },
  { emoji: '🍬', name: 'bala', keywords: ['candy', 'doce'] },
  { emoji: '🍫', name: 'chocolate', keywords: ['chocolate', 'barra', 'doce'] },
  { emoji: '🍩', name: 'donut', keywords: ['donut', 'rosquinha', 'doce'] },
  { emoji: '🍪', name: 'biscoito', keywords: ['cookie', 'bolacha'] },
  { emoji: '🌰', name: 'castanha', keywords: ['chestnut', 'nuts', 'nozes'] },
  { emoji: '🥜', name: 'amendoim', keywords: ['peanut', 'nozes'] },
  { emoji: '🍯', name: 'mel', keywords: ['honey', 'abelha'] },
  { emoji: '🥛', name: 'leite', keywords: ['milk', 'copo'] },
  { emoji: '🍼', name: 'mamadeira', keywords: ['baby bottle', 'bebê', 'leite'] },
  { emoji: '🫖', name: 'bule', keywords: ['teapot', 'chá'] },
  { emoji: '☕', name: 'café', keywords: ['coffee', 'xícara', 'quente'] },
  { emoji: '🍵', name: 'chá', keywords: ['tea', 'matcha', 'verde'] },
  { emoji: '🧃', name: 'suco', keywords: ['juice box', 'caixinha'] },
  { emoji: '🥤', name: 'copo', keywords: ['cup', 'refrigerante', 'bebida'] },
  { emoji: '🧋', name: 'bubble tea', keywords: ['boba', 'chá', 'taiwanês'] },
  { emoji: '🍶', name: 'sakê', keywords: ['sake', 'japonês', 'bebida'] },
  { emoji: '🍺', name: 'cerveja', keywords: ['beer', 'chopp', 'álcool'] },
  { emoji: '🍻', name: 'brinde', keywords: ['cheers', 'cerveja', 'bar'] },
  { emoji: '🥂', name: 'champagne', keywords: ['champagne', 'espumante', 'festa'] },
  { emoji: '🍷', name: 'vinho', keywords: ['wine', 'tinto', 'álcool'] },
  { emoji: '🥃', name: 'whisky', keywords: ['whisky', 'uísque', 'drink'] },
  { emoji: '🍸', name: 'martini', keywords: ['cocktail', 'drink', 'bar'] },
  { emoji: '🍹', name: 'drink tropical', keywords: ['tropical drink', 'coquetel', 'praia'] },
  { emoji: '🧊', name: 'gelo', keywords: ['ice', 'cubo', 'frio'] },
  { emoji: '🥝', name: 'kiwi', keywords: ['kiwi', 'fruta', 'verde'] },
  { emoji: '🍅', name: 'tomate', keywords: ['tomato', 'vermelho'] },
  { emoji: '🍆', name: 'berinjela', keywords: ['eggplant', 'roxo'] },
  { emoji: '🥑', name: 'abacate', keywords: ['avocado', 'guacamole'] },
  { emoji: '🥦', name: 'brócolis', keywords: ['broccoli', 'verde', 'vegetal'] },
  { emoji: '🥬', name: 'alface', keywords: ['lettuce', 'verde', 'salada'] },
  { emoji: '🥒', name: 'pepino', keywords: ['cucumber', 'verde'] },
  { emoji: '🌶️', name: 'pimenta', keywords: ['pepper', 'picante', 'vermelho'] },
  { emoji: '🫑', name: 'pimentão', keywords: ['bell pepper', 'colorido'] },
  { emoji: '🌽', name: 'milho', keywords: ['corn', 'amarelo', 'espiga'] },
  { emoji: '🥕', name: 'cenoura', keywords: ['carrot', 'laranja'] },
  { emoji: '🫒', name: 'azeitona', keywords: ['olive', 'azeite'] },
  { emoji: '🧄', name: 'alho', keywords: ['garlic', 'tempero'] },
  { emoji: '🧅', name: 'cebola', keywords: ['onion', 'tempero'] },
  { emoji: '🥔', name: 'batata', keywords: ['potato', 'purê'] },
  { emoji: '🍠', name: 'batata doce', keywords: ['sweet potato', 'roxa'] },
  { emoji: '🥐', name: 'croissant', keywords: ['croissant', 'francês', 'padaria'] },
  { emoji: '🥯', name: 'bagel', keywords: ['bagel', 'pão', 'rosca'] },
  { emoji: '🍞', name: 'pão', keywords: ['bread', 'pão de forma'] },
  { emoji: '🥖', name: 'baguete', keywords: ['baguette', 'francês', 'padaria'] },
  { emoji: '🥨', name: 'pretzel', keywords: ['pretzel', 'alemão'] },
  { emoji: '🧀', name: 'queijo', keywords: ['cheese', 'amarelo'] },
  { emoji: '🍳', name: 'frigideira', keywords: ['cooking', 'ovo', 'café da manhã'] },
  { emoji: '🍽️', name: 'prato', keywords: ['plate', 'talheres', 'restaurante'] },
  { emoji: '🥢', name: 'hashi', keywords: ['chopsticks', 'japonês', 'chinês'] },
  { emoji: '🥄', name: 'colher', keywords: ['spoon', 'talher'] },
  { emoji: '🍴', name: 'talheres', keywords: ['fork', 'knife', 'garfo', 'faca'] },
  // Fruits
  { emoji: '🍎', name: 'maçã vermelha', keywords: ['apple', 'red', 'fruta'] },
  { emoji: '🍏', name: 'maçã verde', keywords: ['apple', 'green', 'fruta'] },
  { emoji: '🍐', name: 'pera', keywords: ['pear', 'fruta'] },
  { emoji: '🍊', name: 'laranja', keywords: ['orange', 'tangerina', 'fruta'] },
  { emoji: '🍋', name: 'limão', keywords: ['lemon', 'amarelo', 'fruta'] },
  { emoji: '🍌', name: 'banana', keywords: ['banana', 'fruta'] },
  { emoji: '🍉', name: 'melancia', keywords: ['watermelon', 'fruta', 'verão'] },
  { emoji: '🍇', name: 'uva', keywords: ['grape', 'roxo', 'fruta'] },
  { emoji: '🍓', name: 'morango', keywords: ['strawberry', 'vermelho', 'fruta'] },
  { emoji: '🫐', name: 'mirtilo', keywords: ['blueberry', 'azul', 'fruta'] },
  { emoji: '🍈', name: 'melão', keywords: ['melon', 'fruta'] },
  { emoji: '🍒', name: 'cereja', keywords: ['cherry', 'vermelho', 'fruta'] },
  { emoji: '🍑', name: 'pêssego', keywords: ['peach', 'fruta'] },
  { emoji: '🥭', name: 'manga', keywords: ['mango', 'tropical', 'fruta'] },
  { emoji: '🍍', name: 'abacaxi', keywords: ['pineapple', 'tropical', 'fruta'] },
  { emoji: '🥥', name: 'coco', keywords: ['coconut', 'tropical', 'fruta'] },
  // Nature & Animals (for themed restaurants)
  { emoji: '🌿', name: 'ervas', keywords: ['herb', 'folha', 'natural', 'orgânico'] },
  { emoji: '🌱', name: 'broto', keywords: ['seedling', 'vegano', 'natural'] },
  { emoji: '🐟', name: 'peixe', keywords: ['fish', 'sushi', 'frutos do mar'] },
  { emoji: '🐠', name: 'peixe tropical', keywords: ['tropical fish', 'aquário'] },
  { emoji: '🦐', name: 'camarão', keywords: ['shrimp', 'frutos do mar'] },
  { emoji: '🦀', name: 'caranguejo', keywords: ['crab', 'frutos do mar'] },
  { emoji: '🦞', name: 'lagosta', keywords: ['lobster', 'frutos do mar'] },
  { emoji: '🐄', name: 'vaca', keywords: ['cow', 'boi', 'carne', 'fazenda'] },
  { emoji: '🐖', name: 'porco', keywords: ['pig', 'suíno', 'bacon'] },
  { emoji: '🐔', name: 'galinha', keywords: ['chicken', 'frango', 'fazenda'] },
  { emoji: '🔥', name: 'fogo', keywords: ['fire', 'churrasco', 'quente', 'picante'] },
  { emoji: '⭐', name: 'estrela', keywords: ['star', 'especial', 'destaque'] },
  { emoji: '💯', name: 'cem', keywords: ['hundred', 'perfeito', 'top'] },
  { emoji: '✨', name: 'brilho', keywords: ['sparkles', 'especial', 'novo'] },
  { emoji: '🎉', name: 'festa', keywords: ['party', 'celebração', 'combo'] },
  { emoji: '❤️', name: 'coração', keywords: ['heart', 'amor', 'favorito'] },
  { emoji: '💚', name: 'coração verde', keywords: ['green heart', 'vegano', 'saudável'] },
  { emoji: '🏠', name: 'casa', keywords: ['house', 'caseiro', 'artesanal'] },
  { emoji: '👨‍🍳', name: 'chef', keywords: ['chef', 'cozinheiro', 'especial'] },
  { emoji: '🛵', name: 'moto', keywords: ['delivery', 'entrega', 'motoboy'] },
  { emoji: '📦', name: 'caixa', keywords: ['box', 'kit', 'combo', 'pacote'] },
  { emoji: '🎁', name: 'presente', keywords: ['gift', 'brinde', 'promoção'] },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJIS;
    
    const searchLower = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return EMOJIS.filter(({ name, keywords }) => {
      const nameLower = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (nameLower.includes(searchLower)) return true;
      
      return keywords.some(keyword => 
        keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchLower)
      );
    });
  }, [search]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-20 h-12 border border-border rounded-lg bg-card text-3xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          {value || '🍽️'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emoji... (ex: pizza, hambúrguer)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
          
          <ScrollArea className="h-52">
            {filteredEmojis.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum emoji encontrado
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map(({ emoji, name }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 text-xl flex items-center justify-center rounded hover:bg-muted transition-colors"
                    title={name}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
