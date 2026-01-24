import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerAddress {
  id: string;
  restaurant_id: string;
  customer_phone: string;
  customer_name: string | null;
  label: string;
  cep: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomerAddresses = (restaurantId: string | undefined, phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  return useQuery({
    queryKey: ['customer-addresses', restaurantId, cleanPhone],
    queryFn: async (): Promise<CustomerAddress[]> => {
      if (!restaurantId || cleanPhone.length < 10) return [];

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer addresses:', error);
        return [];
      }

      return data as CustomerAddress[];
    },
    enabled: !!restaurantId && cleanPhone.length >= 10,
  });
};

export const useSaveCustomerAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: {
      restaurant_id: string;
      customer_phone: string;
      customer_name?: string;
      label?: string;
      cep?: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      is_default?: boolean;
    }) => {
      const cleanPhone = address.customer_phone.replace(/\D/g, '');
      
      // If this is set as default, remove default from other addresses
      if (address.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('restaurant_id', address.restaurant_id)
          .eq('customer_phone', cleanPhone);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          ...address,
          customer_phone: cleanPhone,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-addresses', data.restaurant_id],
      });
    },
  });
};

export const useUpdateCustomerAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerAddress> & { id: string }) => {
      // If setting as default, first unset other defaults
      if (updates.is_default) {
        const { data: currentAddress } = await supabase
          .from('customer_addresses')
          .select('restaurant_id, customer_phone')
          .eq('id', id)
          .single();
        
        if (currentAddress) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('restaurant_id', currentAddress.restaurant_id)
            .eq('customer_phone', currentAddress.customer_phone)
            .neq('id', id);
        }
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-addresses', data.restaurant_id],
      });
    },
  });
};

export const useDeleteCustomerAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-addresses', data.restaurantId],
      });
    },
  });
};
