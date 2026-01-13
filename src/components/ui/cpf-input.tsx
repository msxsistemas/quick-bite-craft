import * as React from "react";
import { cn } from "@/lib/utils";

export interface CpfInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
}

// Formata CPF como 000.000.000-00
const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Valida CPF com algoritmo de dígitos verificadores
export const isValidCpf = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(digits)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
};

// Retorna apenas os dígitos do CPF
export const getCpfDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(
  ({ className, value, onChange, placeholder = "000.000.000-00", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCpf(e.target.value);
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
        maxLength={14}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
CpfInput.displayName = "CpfInput";

export { CpfInput, formatCpf };
