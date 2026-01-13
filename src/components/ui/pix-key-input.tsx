import * as React from "react";
import { PhoneInput, isValidPhone, formatPhone } from "./phone-input";
import { CpfInput, isValidCpf, formatCpf } from "./cpf-input";
import { CnpjInput, isValidCnpj, formatCnpj } from "./cnpj-input";
import { Input } from "./input";

export type PixKeyType = 'phone' | 'email' | 'cpf' | 'cnpj' | 'random';

export interface PixKeyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  keyType: PixKeyType | string;
  onTypeDetected?: (detectedType: PixKeyType) => void;
}

// Detecta automaticamente o tipo da chave PIX baseado no valor
export const detectPixKeyType = (value: string): PixKeyType | null => {
  if (!value || value.trim() === '') return null;
  
  const cleanValue = value.trim();
  const digitsOnly = cleanValue.replace(/\D/g, '');
  
  // Verifica se é email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(cleanValue)) {
    return 'email';
  }
  
  // Verifica se é CPF (11 dígitos)
  if (digitsOnly.length === 11 && /^\d+$/.test(digitsOnly)) {
    // Verifica se parece CPF formatado ou apenas números
    if (isValidCpf(cleanValue) || /^\d{11}$/.test(digitsOnly)) {
      return 'cpf';
    }
  }
  
  // Verifica se é CNPJ (14 dígitos)
  if (digitsOnly.length === 14 && /^\d+$/.test(digitsOnly)) {
    return 'cnpj';
  }
  
  // Verifica se é telefone (10 ou 11 dígitos começando com DDD válido)
  if ((digitsOnly.length === 10 || digitsOnly.length === 11) && /^[1-9][0-9]/.test(digitsOnly)) {
    // DDDs válidos começam de 11 a 99
    const ddd = parseInt(digitsOnly.substring(0, 2));
    if (ddd >= 11 && ddd <= 99) {
      return 'phone';
    }
  }
  
  // Se não detectou nenhum padrão específico, é aleatória
  if (cleanValue.length >= 5) {
    return 'random';
  }
  
  return null;
};

// Formata o valor baseado no tipo detectado
const formatValueByType = (value: string, type: PixKeyType): string => {
  const digitsOnly = value.replace(/\D/g, '');
  
  switch (type) {
    case 'phone':
      return formatPhone(value);
    case 'cpf':
      return formatCpf(value);
    case 'cnpj':
      return formatCnpj(value);
    case 'email':
    case 'random':
    default:
      return value;
  }
};

// Valida a chave PIX baseado no tipo
export const isValidPixKey = (value: string, keyType: string): { valid: boolean; message?: string } => {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Chave PIX é obrigatória' };
  }

  switch (keyType) {
    case 'phone':
      if (!isValidPhone(value)) {
        return { valid: false, message: 'Telefone inválido (deve ter 10 ou 11 dígitos)' };
      }
      break;
    case 'cpf':
      if (!isValidCpf(value)) {
        return { valid: false, message: 'CPF inválido (verifique os dígitos)' };
      }
      break;
    case 'cnpj':
      if (!isValidCnpj(value)) {
        return { valid: false, message: 'CNPJ inválido (verifique os dígitos)' };
      }
      break;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'E-mail inválido' };
      }
      break;
    case 'random':
      if (value.length < 5) {
        return { valid: false, message: 'Chave aleatória deve ter pelo menos 5 caracteres' };
      }
      break;
  }

  return { valid: true };
};

const PixKeyInput = React.forwardRef<HTMLInputElement, PixKeyInputProps>(
  ({ className, value, onChange, keyType, onTypeDetected, ...props }, ref) => {
    // Handle type change - clear value when type changes
    const prevKeyTypeRef = React.useRef(keyType);
    const isUserTypeChange = React.useRef(false);
    
    React.useEffect(() => {
      if (prevKeyTypeRef.current !== keyType) {
        // Only clear if it was a manual type change, not auto-detected
        if (isUserTypeChange.current) {
          onChange('');
        }
        isUserTypeChange.current = true;
        prevKeyTypeRef.current = keyType;
      }
    }, [keyType, onChange]);

    // Handle paste event for auto-detection
    const handlePaste = React.useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData('text');
      const detectedType = detectPixKeyType(pastedText);
      
      if (detectedType && onTypeDetected) {
        e.preventDefault();
        isUserTypeChange.current = false;
        onTypeDetected(detectedType);
        
        // Format and set the value after type detection
        const formattedValue = formatValueByType(pastedText, detectedType);
        onChange(formattedValue);
      }
    }, [onTypeDetected, onChange]);

    const commonProps = {
      onPaste: handlePaste,
      className,
      ...props
    };

    switch (keyType) {
      case 'phone':
        return (
          <PhoneInput
            ref={ref}
            value={value}
            onChange={onChange}
            {...commonProps}
          />
        );
      case 'cpf':
        return (
          <CpfInput
            ref={ref}
            value={value}
            onChange={onChange}
            {...commonProps}
          />
        );
      case 'cnpj':
        return (
          <CnpjInput
            ref={ref}
            value={value}
            onChange={onChange}
            {...commonProps}
          />
        );
      case 'email':
        return (
          <Input
            ref={ref}
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="email@exemplo.com"
            {...commonProps}
          />
        );
      case 'random':
      default:
        return (
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Chave aleatória"
            {...commonProps}
          />
        );
    }
  }
);
PixKeyInput.displayName = "PixKeyInput";

export { PixKeyInput };
