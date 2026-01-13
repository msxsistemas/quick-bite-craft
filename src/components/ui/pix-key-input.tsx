import * as React from "react";
import { cn } from "@/lib/utils";
import { PhoneInput } from "./phone-input";
import { CpfInput } from "./cpf-input";
import { CnpjInput } from "./cnpj-input";
import { Input } from "./input";

export interface PixKeyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  keyType: 'phone' | 'email' | 'cpf' | 'cnpj' | 'random' | string;
}

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
