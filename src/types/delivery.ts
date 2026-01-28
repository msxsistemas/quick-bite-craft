export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  logo: string;
  banner: string;
  phone: string;
  whatsapp: string;
  address: string;
  deliveryTime: string;
  deliveryFee: number;
  isOpen: boolean;
  openingHours: OpeningHours[];
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  isAvailable: boolean;
  hasOptions?: boolean;
  extra_groups?: string[];
}

export interface CartItemExtra {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
  quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  extras?: CartItemExtra[];
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: string;
  createdAt: Date;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'delivering' 
  | 'delivered' 
  | 'cancelled';

export interface Reseller {
  id: string;
  name: string;
  email: string;
  restaurants: Restaurant[];
}
