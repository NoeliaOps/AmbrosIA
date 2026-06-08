// Placeholder types — regenerate with: npm run db:types
// Once migrations are applied, run: supabase gen types typescript --linked > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          email: string
          full_name: string | null
          role: "admin" | "coordinator" | "chef"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id: string
          email: string
          full_name?: string | null
          role?: "admin" | "coordinator" | "chef"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          full_name?: string | null
          role?: "admin" | "coordinator" | "chef"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      module_settings: {
        Row: {
          id: string
          org_id: string
          module_key: string
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          module_key: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          module_key?: string
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          id: string
          org_id: string
          name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          category: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          category?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          category?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      ingredient_purchase_units: {
        Row: {
          created_at: string
          factor: number
          id: string
          ingredient_id: string
          is_default: boolean
          org_id: string
          price: number
          supplier_id: string | null
          unit: string
          updated_at: string
          whole_units: boolean
        }
        Insert: {
          created_at?: string
          factor?: number
          id?: string
          ingredient_id: string
          is_default?: boolean
          org_id: string
          price?: number
          supplier_id?: string | null
          unit: string
          updated_at?: string
          whole_units?: boolean
        }
        Update: {
          created_at?: string
          factor?: number
          id?: string
          ingredient_id?: string
          is_default?: boolean
          org_id?: string
          price?: number
          supplier_id?: string | null
          unit?: string
          updated_at?: string
          whole_units?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_purchase_units_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_purchase_units_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_purchase_units_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          id: string
          org_id: string
          name: string
          unit: string
          category: string | null
          current_price: number
          preferred_supplier_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          unit: string
          category?: string | null
          current_price?: number
          preferred_supplier_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          unit?: string
          category?: string | null
          current_price?: number
          preferred_supplier_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      ingredient_price_history: {
        Row: {
          id: string
          ingredient_id: string
          price: number
          recorded_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          ingredient_id: string
          price: number
          recorded_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          ingredient_id?: string
          price?: number
          recorded_at?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_price_history_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          }
        ]
      }
      dishes: {
        Row: {
          id: string
          org_id: string
          name: string
          category: string | null
          servings_yield: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          category?: string | null
          servings_yield?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          category?: string | null
          servings_yield?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      recipe_items: {
        Row: {
          id: string
          dish_id: string
          ingredient_id: string
          quantity: number
          notes: string | null
        }
        Insert: {
          id?: string
          dish_id: string
          ingredient_id: string
          quantity: number
          notes?: string | null
        }
        Update: {
          id?: string
          dish_id?: string
          ingredient_id?: string
          quantity?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          }
        ]
      }
      menus: {
        Row: {
          id: string
          org_id: string
          name: string
          event_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          event_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          event_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          min_quantity: number
          notes: string | null
          org_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          min_quantity?: number
          notes?: string | null
          org_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          min_quantity?: number
          notes?: string | null
          org_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_dishes: {
        Row: {
          id: string
          menu_id: string
          dish_id: string
          servings: number
          notes: string | null
        }
        Insert: {
          id?: string
          menu_id: string
          dish_id: string
          servings: number
          notes?: string | null
        }
        Update: {
          id?: string
          menu_id?: string
          dish_id?: string
          servings?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_dishes_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_dishes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_members: {
        Row: {
          id: string
          org_id: string
          name: string
          position: string
          rate: number
          rate_type: "hourly" | "daily" | "event"
          phone: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          position: string
          rate?: number
          rate_type?: "hourly" | "daily" | "event"
          phone?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          position?: string
          rate?: number
          rate_type?: "hourly" | "daily" | "event"
          phone?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      indirect_cost_categories: {
        Row: {
          id: string
          org_id: string
          name: string
          default_amount: number
          allocation_method: "fixed" | "per_guest" | "percentage"
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          default_amount?: number
          allocation_method: "fixed" | "per_guest" | "percentage"
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          default_amount?: number
          allocation_method?: "fixed" | "per_guest" | "percentage"
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indirect_cost_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          org_id: string
          name: string
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          org_id: string
          client_id: string | null
          name: string
          event_type: string | null
          event_date: string
          event_time: string | null
          location: string | null
          guest_count: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          client_id?: string | null
          name: string
          event_type?: string | null
          event_date: string
          event_time?: string | null
          location?: string | null
          guest_count?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          client_id?: string | null
          name?: string
          event_type?: string | null
          event_date?: string
          event_time?: string | null
          location?: string | null
          guest_count?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_templates: {
        Row: {
          created_at: string
          description: string | null
          event_type: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          price_per_guest: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          price_per_guest?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          price_per_guest?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_items: {
        Row: {
          description: string
          id: string
          quantity: number
          sort_order: number
          template_id: string
          unit_cost: number
        }
        Insert: {
          description: string
          id?: string
          quantity?: number
          sort_order?: number
          template_id: string
          unit_cost?: number
        }
        Update: {
          description?: string
          id?: string
          quantity?: number
          sort_order?: number
          template_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          id: string
          event_id: string
          version_number: number
          status: string
          subtotal: number
          discount_amount: number
          total: number
          margin_percent: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          version_number?: number
          status?: string
          subtotal?: number
          discount_amount?: number
          total?: number
          margin_percent?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          version_number?: number
          status?: string
          subtotal?: number
          discount_amount?: number
          total?: number
          margin_percent?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_line_items: {
        Row: {
          id: string
          quote_id: string
          type: string
          reference_id: string | null
          description: string
          unit_cost: number
          quantity: number
          total_cost: number
          sort_order: number
        }
        Insert: {
          id?: string
          quote_id: string
          type?: string
          reference_id?: string | null
          description: string
          unit_cost?: number
          quantity?: number
          total_cost?: number
          sort_order?: number
        }
        Update: {
          id?: string
          quote_id?: string
          type?: string
          reference_id?: string | null
          description?: string
          unit_cost?: number
          quantity?: number
          total_cost?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          event_id: string
          quote_id: string | null
          clauses: unknown[]
          status: string
          signed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          quote_id?: string | null
          clauses?: unknown[]
          status?: string
          signed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          quote_id?: string | null
          clauses?: unknown[]
          status?: string
          signed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      overhead_expenses: {
        Row: {
          amount: number
          concept: string
          created_at: string
          id: string
          notes: string | null
          org_id: string
          period: string
          updated_at: string
        }
        Insert: {
          amount?: number
          concept: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id: string
          period: string
          updated_at?: string
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string
          period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overhead_expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          id: string
          event_id: string
          description: string
          amount: number
          due_date: string
          status: string
          paid_at: string | null
          paid_amount: number | null
          discount_amount: number
          reference: string | null
          notes: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          description: string
          amount: number
          due_date: string
          status?: string
          paid_at?: string | null
          paid_amount?: number | null
          discount_amount?: number
          reference?: string | null
          notes?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          description?: string
          amount?: number
          due_date?: string
          status?: string
          paid_at?: string | null
          paid_amount?: number | null
          discount_amount?: number
          reference?: string | null
          notes?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      requisitions: {
        Row: {
          id: string
          org_id: string
          event_id: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          event_id: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          event_id?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      requisition_items: {
        Row: {
          id: string
          requisition_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          notes: string | null
        }
        Insert: {
          id?: string
          requisition_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost?: number
          total_cost?: number
          notes?: string | null
        }
        Update: {
          id?: string
          requisition_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          unit_cost?: number
          total_cost?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_orders: {
        Row: {
          id: string
          org_id: string
          requisition_id: string
          event_id: string
          supplier_id: string | null
          status: string
          buy_by_date: string | null
          received_at: string | null
          subtotal: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          requisition_id: string
          event_id: string
          supplier_id?: string | null
          status?: string
          buy_by_date?: string | null
          received_at?: string | null
          subtotal?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          requisition_id?: string
          event_id?: string
          supplier_id?: string | null
          status?: string
          buy_by_date?: string | null
          received_at?: string | null
          subtotal?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      actual_purchases: {
        Row: {
          id: string
          org_id: string
          event_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          purchased_at: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          event_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          purchased_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          event_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          unit_cost?: number
          total_cost?: number
          purchased_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actual_purchases_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_dishes: {
        Row: {
          created_at: string
          dish_id: string
          event_id: string
          id: string
          org_id: string
          servings: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          event_id: string
          id?: string
          org_id: string
          servings?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          event_id?: string
          id?: string
          org_id?: string
          servings?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_dishes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dishes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dishes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_indirect_costs: {
        Row: {
          id: string
          org_id: string
          event_id: string
          category_id: string
          amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          event_id: string
          category_id: string
          amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          event_id?: string
          category_id?: string
          amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_indirect_costs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_indirect_costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "indirect_cost_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          received_quantity: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          purchase_order_id: string
          ingredient_id: string
          quantity: number
          unit: string
          unit_cost?: number
          total_cost?: number
          received_quantity?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          purchase_order_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          unit_cost?: number
          total_cost?: number
          received_quantity?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          }
        ]
      }
      event_commissions: {
        Row: {
          amount: number
          basis: string
          beneficiary: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          org_id: string
          paid_at: string | null
          percentage: number | null
          role: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          basis?: string
          beneficiary: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          org_id: string
          paid_at?: string | null
          percentage?: number | null
          role?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          basis?: string
          beneficiary?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          percentage?: number | null
          role?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_commissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_commissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_postmortems: {
        Row: {
          created_at: string
          event_id: string
          id: string
          lessons: string | null
          org_id: string
          rating: number | null
          to_improve: string | null
          updated_at: string
          went_well: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          lessons?: string | null
          org_id: string
          rating?: number | null
          to_improve?: string | null
          updated_at?: string
          went_well?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          lessons?: string | null
          org_id?: string
          rating?: number | null
          to_improve?: string | null
          updated_at?: string
          went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_postmortems_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_postmortems_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff_assignments: {
        Row: {
          id: string
          org_id: string
          event_id: string
          staff_member_id: string
          role: string | null
          call_time: string | null
          estimated_hours: number
          computed_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          event_id: string
          staff_member_id: string
          role?: string | null
          call_time?: string | null
          estimated_hours?: number
          computed_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          event_id?: string
          staff_member_id?: string
          role?: string | null
          call_time?: string | null
          estimated_hours?: number
          computed_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_assignments_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: "admin" | "coordinator" | "chef"
      event_status: "cotizado" | "contratado" | "en_requisicion" | "en_compras" | "completado" | "cancelado"
      quote_status: "borrador" | "enviada" | "aprobada" | "rechazada"
      payment_status: "pendiente" | "pagado" | "vencido"
      requisition_status: "generada" | "revisada" | "aprobada"
      po_status: "pendiente" | "enviada" | "recibida"
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
