import * as React from "react";
import { cn } from "@/lib/utils";

export interface CepInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  onCepComplete?: (cep: string) => void;
}

// Formata CEP como 00000-000
const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

// Valida se o CEP tem 8 dígitos
export const isValidCep = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 8;
};

// Retorna apenas os dígitos do CEP
export const getCepDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

const CepInput = React.forwardRef<HTMLInputElement, CepInputProps>(
  ({ className, value, onChange, onCepComplete, placeholder = "00000-000", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCep(e.target.value);
      onChange(formatted);
      
      const digits = e.target.value.replace(/\D/g, '');
      if (digits.length === 8 && onCepComplete) {
        onCepComplete(digits);
      }
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={9}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(221,83%,53%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
CepInput.displayName = "CepInput";

export { CepInput, formatCep };
