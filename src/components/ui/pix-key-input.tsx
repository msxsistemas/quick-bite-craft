import * as React from "react";
import { PhoneInput, isValidPhone } from "./phone-input";
import { CpfInput, isValidCpf } from "./cpf-input";
import { CnpjInput, isValidCnpj } from "./cnpj-input";
import { Input } from "./input";

export interface PixKeyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  keyType: 'phone' | 'email' | 'cpf' | 'cnpj' | 'random' | string;
}

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
  ({ className, value, onChange, keyType, ...props }, ref) => {
    // Handle type change - clear value when type changes
    const prevKeyTypeRef = React.useRef(keyType);
    
    React.useEffect(() => {
      if (prevKeyTypeRef.current !== keyType) {
        onChange('');
        prevKeyTypeRef.current = keyType;
      }
    }, [keyType, onChange]);

    switch (keyType) {
      case 'phone':
        return (
          <PhoneInput
            ref={ref}
            value={value}
            onChange={onChange}
            className={className}
            {...props}
          />
        );
      case 'cpf':
        return (
          <CpfInput
            ref={ref}
            value={value}
            onChange={onChange}
            className={className}
            {...props}
          />
        );
      case 'cnpj':
        return (
          <CnpjInput
            ref={ref}
            value={value}
            onChange={onChange}
            className={className}
            {...props}
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
            className={className}
            {...props}
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
            className={className}
            {...props}
          />
        );
    }
  }
);
PixKeyInput.displayName = "PixKeyInput";

export { PixKeyInput };
