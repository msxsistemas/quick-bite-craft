export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_value: number
          restaurant_id: string
          updated_at: string
          used_count: number
          visible: boolean
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number
          restaurant_id: string
          updated_at?: string
          used_count?: number
          visible?: boolean
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number
          restaurant_id?: string
          updated_at?: string
          used_count?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          cep: string | null
          city: string
          complement: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          is_default: boolean | null
          label: string | null
          neighborhood: string
          number: string
          restaurant_id: string
          street: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          city: string
          complement?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood: string
          number: string
          restaurant_id: string
          street: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          city?: string
          complement?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood?: string
          number?: string
          restaurant_id?: string
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          lifetime_points: number
          restaurant_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          lifetime_points?: number
          restaurant_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          lifetime_points?: number
          restaurant_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          fee: number
          id: string
          min_order: number
          name: string
          restaurant_id: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          min_order?: number
          name: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          min_order?: number
          name?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_groups: {
        Row: {
          active: boolean
          allow_repeat: boolean
          created_at: string
          display_title: string
          id: string
          internal_name: string
          max_selections: number
          required: boolean
          restaurant_id: string
          sort_order: number
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          allow_repeat?: boolean
          created_at?: string
          display_title: string
          id?: string
          internal_name: string
          max_selections?: number
          required?: boolean
          restaurant_id: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          allow_repeat?: boolean
          created_at?: string
          display_title?: string
          id?: string
          internal_name?: string
          max_selections?: number
          required?: boolean
          restaurant_id?: string
          sort_order?: number
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_options: {
        Row: {
          active: boolean
          created_at: string
          group_id: string
          id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_id: string
          id?: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "extra_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          min_order_value: number
          name: string
          points_required: number
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          min_order_value?: number
          name: string
          points_required: number
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          min_order_value?: number
          name?: string
          points_required?: number
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_hours: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          restaurant_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          restaurant_id: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          restaurant_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operating_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          coupon_id: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivering_at: string | null
          delivery_fee: number
          delivery_zone_id: string | null
          discount: number
          id: string
          items: Json
          notes: string | null
          order_number: number
          payment_change: number | null
          payment_method: string
          preparing_at: string | null
          ready_at: string | null
          restaurant_id: string
          status: string
          subtotal: number
          table_id: string | null
          tip_amount: number
          total: number
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivering_at?: string | null
          delivery_fee?: number
          delivery_zone_id?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: number
          payment_change?: number | null
          payment_method?: string
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id: string
          status?: string
          subtotal?: number
          table_id?: string | null
          tip_amount?: number
          total?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivering_at?: string | null
          delivery_fee?: number
          delivery_zone_id?: string | null
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: number
          payment_change?: number | null
          payment_method?: string
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id?: string
          status?: string
          subtotal?: number
          table_id?: string | null
          tip_amount?: number
          total?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "waiters"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          loyalty_id: string
          order_id: string | null
          points: number
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          loyalty_id: string
          order_id?: string | null
          points: number
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          loyalty_id?: string
          order_id?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_loyalty_id_fkey"
            columns: ["loyalty_id"]
            isOneToOne: false
            referencedRelation: "customer_loyalty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          extra_groups: string[] | null
          id: string
          image_url: string | null
          name: string
          price: number
          restaurant_id: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          extra_groups?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          restaurant_id: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          extra_groups?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reseller_settings: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          mercadopago_access_token: string | null
          mercadopago_enabled: boolean | null
          mercadopago_public_key: string | null
          phone: string | null
          primary_color: string | null
          reseller_id: string
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mercadopago_access_token?: string | null
          mercadopago_enabled?: boolean | null
          mercadopago_public_key?: string | null
          phone?: string | null
          primary_color?: string | null
          reseller_id: string
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mercadopago_access_token?: string | null
          mercadopago_enabled?: boolean | null
          mercadopago_public_key?: string | null
          phone?: string | null
          primary_color?: string | null
          reseller_id?: string
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "restaurant_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          is_owner: boolean | null
          password_hash: string | null
          restaurant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_owner?: boolean | null
          password_hash?: string | null
          restaurant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_owner?: boolean | null
          password_hash?: string | null
          restaurant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_admins_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          app_name: string | null
          charge_mode: string
          created_at: string
          fixed_delivery_fee: number
          id: string
          loyalty_enabled: boolean
          loyalty_min_order_for_points: number
          loyalty_points_per_real: number
          max_delivery_time: number
          min_delivery_time: number
          pix_key: string | null
          pix_key_type: string | null
          restaurant_id: string
          short_name: string | null
          updated_at: string
          whatsapp_msg_accepted: string | null
          whatsapp_msg_delivered: string | null
          whatsapp_msg_delivery: string | null
          whatsapp_msg_pix: string | null
        }
        Insert: {
          app_name?: string | null
          charge_mode?: string
          created_at?: string
          fixed_delivery_fee?: number
          id?: string
          loyalty_enabled?: boolean
          loyalty_min_order_for_points?: number
          loyalty_points_per_real?: number
          max_delivery_time?: number
          min_delivery_time?: number
          pix_key?: string | null
          pix_key_type?: string | null
          restaurant_id: string
          short_name?: string | null
          updated_at?: string
          whatsapp_msg_accepted?: string | null
          whatsapp_msg_delivered?: string | null
          whatsapp_msg_delivery?: string | null
          whatsapp_msg_pix?: string | null
        }
        Update: {
          app_name?: string | null
          charge_mode?: string
          created_at?: string
          fixed_delivery_fee?: number
          id?: string
          loyalty_enabled?: boolean
          loyalty_min_order_for_points?: number
          loyalty_points_per_real?: number
          max_delivery_time?: number
          min_delivery_time?: number
          pix_key?: string | null
          pix_key_type?: string | null
          restaurant_id?: string
          short_name?: string | null
          updated_at?: string
          whatsapp_msg_accepted?: string | null
          whatsapp_msg_delivered?: string | null
          whatsapp_msg_delivery?: string | null
          whatsapp_msg_pix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_fee: number
          plan_id: string | null
          restaurant_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_fee?: number
          plan_id?: string | null
          restaurant_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_fee?: number
          plan_id?: string | null
          restaurant_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          banner: string | null
          created_at: string
          delivery_fee: number | null
          delivery_time: string | null
          id: string
          is_manual_mode: boolean
          is_open: boolean | null
          logo: string | null
          name: string
          phone: string | null
          reseller_id: string
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_time?: string | null
          id?: string
          is_manual_mode?: boolean
          is_open?: boolean | null
          logo?: string | null
          name: string
          phone?: string | null
          reseller_id: string
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_time?: string | null
          id?: string
          is_manual_mode?: boolean
          is_open?: boolean | null
          logo?: string | null
          name?: string
          phone?: string | null
          reseller_id?: string
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          external_payment_id: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "restaurant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          reseller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          reseller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          reseller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          current_order_id: string | null
          current_waiter_id: string | null
          description: string | null
          id: string
          name: string
          restaurant_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          current_waiter_id?: string | null
          description?: string | null
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          current_waiter_id?: string | null
          description?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_current_waiter_id_fkey"
            columns: ["current_waiter_id"]
            isOneToOne: false
            referencedRelation: "waiters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiters: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          phone: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          phone: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiters_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_loyalty_points: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_order_id: string
          p_order_total: number
          p_restaurant_id: string
        }
        Returns: number
      }
      can_manage_restaurant: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      claim_restaurant_admin: {
        Args: { restaurant_slug: string }
        Returns: string
      }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_restaurant_admin: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      is_restaurant_owner: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_loyalty_points: {
        Args: {
          p_customer_phone: string
          p_order_id: string
          p_restaurant_id: string
          p_reward_id: string
        }
        Returns: {
          discount_type: string
          discount_value: number
          message: string
          success: boolean
        }[]
      }
      use_coupon: { Args: { p_coupon_id: string }; Returns: undefined }
      validate_coupon: {
        Args: { p_code: string; p_order_total: number; p_restaurant_id: string }
        Returns: {
          coupon_id: string
          discount_type: string
          discount_value: number
          error_message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "reseller" | "restaurant_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["reseller", "restaurant_admin"],
    },
  },
} as const
