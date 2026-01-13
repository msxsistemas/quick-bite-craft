import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
  showPrefix?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, showPrefix = false, placeholder = "0,00", ...props }, ref) => {
    // Format number to display string (e.g., 99.90 -> "99,90")
    const formatToDisplay = (val: number | string): string => {
      const num = typeof val === "string" ? parseFloat(val) || 0 : val;
      if (num === 0) return "";
      const formatted = num.toFixed(2).replace(".", ",");
      // Add thousand separators
      const parts = formatted.split(",");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return showPrefix ? `R$ ${parts.join(",")}` : parts.join(",");
    };

    // Parse display string to number (e.g., "99,90" -> 99.90)
    const parseToNumber = (displayValue: string): number => {
      if (!displayValue) return 0;
      // Remove prefix, dots (thousand sep), and convert comma to dot
      const cleaned = displayValue
        .replace(/R\$\s?/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      return parseFloat(cleaned) || 0;
    };

    const [displayValue, setDisplayValue] = React.useState(() => formatToDisplay(value));

    // Update display when value prop changes
    React.useEffect(() => {
      const num = typeof value === "string" ? parseFloat(value) || 0 : value;
      const currentNum = parseToNumber(displayValue);
      if (Math.abs(num - currentNum) > 0.001) {
        setDisplayValue(formatToDisplay(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Extract only digits
      const digits = input.replace(/\D/g, "");
      
      if (!digits) {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Convert cents to reais
      const cents = parseInt(digits, 10);
      const reais = cents / 100;

      // Format for display
      const formatted = reais.toFixed(2).replace(".", ",");
      const parts = formatted.split(",");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const displayFormatted = showPrefix ? `R$ ${parts.join(",")}` : parts.join(",");

      setDisplayValue(displayFormatted);
      onChange(reais);
    };

    return (
      <input
        type="text"
        inputMode="numeric"
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
