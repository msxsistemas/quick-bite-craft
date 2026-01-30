import { z } from 'zod';
import { isValidPhone } from '@/components/ui/phone-input';

// Payment types
export type PaymentMethod = 'cash' | 'pix' | 'card' | '';
export type PaymentTab = 'online' | 'delivery';
export type OrderType = 'delivery' | 'pickup' | 'dine-in';
export type OrderTypeSelection = OrderType | null;
export type CheckoutStep = 'details' | 'address' | 'delivery-options' | 'payment' | 'review';

// Coupon and Reward interfaces
export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

export interface AppliedReward {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  pointsUsed: number;
}

// Address form data
export interface AddressFormData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  label: string;
  isDefault: boolean;
}

// Validation schemas
export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().refine((val) => isValidPhone(val), { message: 'Telefone inválido (10 ou 11 dígitos)' }),
});

export const addressSchema = z.object({
  cep: z.string().trim().min(8, 'CEP inválido').max(9),
  street: z.string().trim().min(3, 'Rua é obrigatória').max(200),
  number: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  city: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
});
