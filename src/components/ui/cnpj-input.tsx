import * as React from "react";
import { cn } from "@/lib/utils";

export interface CnpjInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

// Formata CNPJ como 00.000.000/0000-00
const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

// Valida CNPJ com algoritmo de dígitos verificadores
export const isValidCnpj = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(digits[12])) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(digits[13])) return false;
  
  return true;
};

// Retorna apenas os dígitos do CNPJ
export const getCnpjDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

const CnpjInput = React.forwardRef<HTMLInputElement, CnpjInputProps>(
  ({ className, value, onChange, placeholder = "00.000.000/0000-00", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCnpj(e.target.value);
      onChange(formatted);
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={18}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
CnpjInput.displayName = "CnpjInput";

export { CnpjInput, formatCnpj };
