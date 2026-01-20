// Legacy re-export for compatibility
// New code should use useToastNotification or useAppToast from @/components/ui/app-toast
import { useAppToast, useToastNotification } from "@/components/ui/app-toast";

export const useToast = useAppToast;
export const toast = {
  success: (message: string) => console.log('[Toast success]:', message),
  error: (message: string) => console.log('[Toast error]:', message),
  info: (message: string) => console.log('[Toast info]:', message),
};

export { useToastNotification };
