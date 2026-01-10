import { Restaurant, Category, Product } from '@/types/delivery';

export const mockRestaurant: Restaurant = {
  id: '1',
  slug: 'burger-house',
  name: 'Burger House',
  logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  banner: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&h=400&fit=crop',
  phone: '(11) 99988-7766',
  whatsapp: '5511999887766',
  address: 'Rua das Hamburguerias, 123 - Centro, São Paulo - SP',
  deliveryTime: '30-50',
  deliveryFee: 5.00,
  isOpen: true,
  openingHours: [
    { day: 'Segunda', open: '11:00', close: '23:00', isOpen: true },
    { day: 'Terça', open: '11:00', close: '23:00', isOpen: true },
    { day: 'Quarta', open: '11:00', close: '23:00', isOpen: true },
    { day: 'Quinta', open: '11:00', close: '23:00', isOpen: true },
    { day: 'Sexta', open: '11:00', close: '00:00', isOpen: true },
    { day: 'Sábado', open: '11:00', close: '00:00', isOpen: true },
    { day: 'Domingo', open: '12:00', close: '22:00', isOpen: true },
  ],
};

export const mockCategories: Category[] = [
  { id: 'all', name: 'Todos', emoji: '🍽️', order: 0 },
  { id: 'burgers', name: 'Hambúrgueres', emoji: '🍔', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop', order: 1 },
  { id: 'portions', name: 'Porções', emoji: '🍟', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop', order: 2 },
  { id: 'drinks', name: 'Bebidas', emoji: '🥤', image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=300&h=200&fit=crop', order: 3 },
  { id: 'desserts', name: 'Sobremesas', emoji: '🍨', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop', order: 4 },
  { id: 'combos', name: 'Combos', emoji: '🌮', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=300&h=200&fit=crop', order: 5 },
];

export const mockProducts: Product[] = [
  // Hambúrgueres
  {
    id: '1',
    name: 'Bacon Lovers',
    description: 'Pão australiano, hambúrguer 200g, bacon crocante, queijo, cebola roxa e barbecue',
    price: 34.90,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
    categoryId: 'burgers',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'BBQ House',
    description: 'Pão brioche, hambúrguer 200g, onion rings, bacon, cheddar e molho BBQ',
    price: 36.90,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
    categoryId: 'burgers',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Classic Burger',
    description: 'Pão tradicional, hambúrguer 180g, queijo, alface, tomate e maionese da casa',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    categoryId: 'burgers',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Double Smash',
    description: 'Pão de batata, 2x hambúrguer smash 100g, queijo americano, picles e molho especial',
    price: 39.90,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
    categoryId: 'burgers',
    isAvailable: true,
  },
  // Porções
  {
    id: '5',
    name: 'Batata Frita',
    description: 'Porção de batatas fritas crocantes com sal e temperos especiais',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop',
    categoryId: 'portions',
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Onion Rings',
    description: 'Anéis de cebola empanados e fritos, acompanha molho especial',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
    categoryId: 'portions',
    isAvailable: true,
  },
  // Bebidas
  {
    id: '7',
    name: 'Coca-Cola 350ml',
    description: 'Refrigerante Coca-Cola lata 350ml',
    price: 6.90,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
    categoryId: 'drinks',
    isAvailable: true,
  },
  {
    id: '8',
    name: 'Suco Natural',
    description: 'Suco natural da fruta 500ml (laranja, limão ou maracujá)',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop',
    categoryId: 'drinks',
    isAvailable: true,
  },
  {
    id: '9',
    name: 'Milk Shake',
    description: 'Milk shake cremoso 400ml (chocolate, morango ou baunilha)',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
    categoryId: 'drinks',
    isAvailable: true,
  },
  // Sobremesas
  {
    id: '10',
    name: 'Brownie com Sorvete',
    description: 'Brownie de chocolate quente com bola de sorvete de creme',
    price: 19.90,
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop',
    categoryId: 'desserts',
    isAvailable: true,
  },
  {
    id: '11',
    name: 'Petit Gateau',
    description: 'Bolinho de chocolate com recheio cremoso e sorvete',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
    categoryId: 'desserts',
    isAvailable: true,
  },
  // Combos
  {
    id: '12',
    name: 'Combo Clássico',
    description: 'Classic Burger + Batata Frita + Refrigerante 350ml',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
    categoryId: 'combos',
    isAvailable: true,
  },
  {
    id: '13',
    name: 'Combo Premium',
    description: 'Bacon Lovers + Onion Rings + Milk Shake',
    price: 64.90,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
    categoryId: 'combos',
    isAvailable: true,
  },
];

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
