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

// Valida se o CNPJ tem 14 dígitos
export const isValidCnpj = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 14;
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
