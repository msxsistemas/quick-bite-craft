// Re-export AppToast for waiter-specific usage
// This maintains backward compatibility while using the centralized toast system
import { useAppToast, useToastNotification, AppToastProvider } from '@/components/ui/app-toast';

export const useWaiterToast = useAppToast;
export const useWaiterToastNotification = useToastNotification;
export const WaiterToastProvider = AppToastProvider;
