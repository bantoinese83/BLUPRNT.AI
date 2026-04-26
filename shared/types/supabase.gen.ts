export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      document_embeddings: {
        Row: {
          content: string;
          created_at: string;
          document_id: string;
          embedding: string;
          id: string;
          project_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          document_id: string;
          embedding: string;
          id?: string;
          project_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          document_id?: string;
          embedding?: string;
          id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_embeddings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      document_processing_queue: {
        Row: {
          attempts: number;
          created_at: string;
          document_id: string;
          error_message: string | null;
          file_path: string;
          id: string;
          mime_type: string;
          owner_user_id: string;
          project_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          document_id: string;
          error_message?: string | null;
          file_path: string;
          id?: string;
          mime_type: string;
          owner_user_id: string;
          project_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          document_id?: string;
          error_message?: string | null;
          file_path?: string;
          id?: string;
          mime_type?: string;
          owner_user_id?: string;
          project_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_processing_queue_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_processing_queue_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          id: string;
          ocr_status: string;
          original_filename: string | null;
          owner_user_id: string | null;
          project_id: string;
          storage_path: string;
          type: string;
          uploaded_by_user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ocr_status?: string;
          original_filename?: string | null;
          owner_user_id?: string | null;
          project_id: string;
          storage_path: string;
          type: string;
          uploaded_by_user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ocr_status?: string;
          original_filename?: string | null;
          owner_user_id?: string | null;
          project_id?: string;
          storage_path?: string;
          type?: string;
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_line_items: {
        Row: {
          category: string | null;
          created_at: string;
          description: string;
          id: string;
          invoice_id: string;
          line_total: number | null;
          quantity: number | null;
          scope_item_id: string | null;
          tax_amount: number;
          tax_rate: number;
          unit_of_measure: string;
          unit_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id: string;
          line_total?: number | null;
          quantity?: number | null;
          scope_item_id?: string | null;
          tax_amount?: number;
          tax_rate?: number;
          unit_of_measure?: string;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          invoice_id?: string;
          line_total?: number | null;
          quantity?: number | null;
          scope_item_id?: string | null;
          tax_amount?: number;
          tax_rate?: number;
          unit_of_measure?: string;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_line_items_scope_item_id_fkey";
            columns: ["scope_item_id"];
            isOneToOne: false;
            referencedRelation: "scope_items";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string;
          currency: string;
          document_id: string | null;
          document_type: string;
          due_date: string | null;
          id: string;
          invoice_number: string | null;
          is_verified: boolean | null;
          issue_date: string | null;
          owner_user_id: string | null;
          payment_status: string;
          project_id: string;
          subtotal: number | null;
          tax_total: number | null;
          total: number;
          updated_at: string | null;
          vendor_contact_info: Json | null;
          vendor_name: string | null;
          warranty_expiry_date: string | null;
          warranty_notified_at: string | null;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          document_id?: string | null;
          document_type?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          is_verified?: boolean | null;
          issue_date?: string | null;
          owner_user_id?: string | null;
          payment_status?: string;
          project_id: string;
          subtotal?: number | null;
          tax_total?: number | null;
          total?: number;
          updated_at?: string | null;
          vendor_contact_info?: Json | null;
          vendor_name?: string | null;
          warranty_expiry_date?: string | null;
          warranty_notified_at?: string | null;
        };
        Update: {
          created_at?: string;
          currency?: string;
          document_id?: string | null;
          document_type?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          is_verified?: boolean | null;
          issue_date?: string | null;
          owner_user_id?: string | null;
          payment_status?: string;
          project_id?: string;
          subtotal?: number | null;
          tax_total?: number | null;
          total?: number;
          updated_at?: string | null;
          vendor_contact_info?: Json | null;
          vendor_name?: string | null;
          warranty_expiry_date?: string | null;
          warranty_notified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      marketing_leads: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          source: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          source?: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          source?: string;
        };
        Relationships: [];
      };
      onboarding_sync: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          payload: Json;
          token: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          payload: Json;
          token: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          payload?: Json;
          token?: string;
        };
        Relationships: [];
      };
      physical_assets: {
        Row: {
          brand: string | null;
          category: string;
          color_code: string | null;
          color_name: string | null;
          created_at: string | null;
          finish: string | null;
          id: string;
          location_in_home: string | null;
          name: string;
          notes: string | null;
          project_id: string;
          storage_path: string | null;
          updated_at: string | null;
        };
        Insert: {
          brand?: string | null;
          category: string;
          color_code?: string | null;
          color_name?: string | null;
          created_at?: string | null;
          finish?: string | null;
          id?: string;
          location_in_home?: string | null;
          name: string;
          notes?: string | null;
          project_id: string;
          storage_path?: string | null;
          updated_at?: string | null;
        };
        Update: {
          brand?: string | null;
          category?: string;
          color_code?: string | null;
          color_name?: string | null;
          created_at?: string | null;
          finish?: string | null;
          id?: string;
          location_in_home?: string | null;
          name?: string;
          notes?: string | null;
          project_id?: string;
          storage_path?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "physical_assets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_gallery: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          photo_type: string;
          project_id: string;
          storage_path: string;
          uploaded_by_user_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          photo_type: string;
          project_id: string;
          storage_path: string;
          uploaded_by_user_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          photo_type?: string;
          project_id?: string;
          storage_path?: string;
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_gallery_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_passes: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          project_id: string;
          purchased_at: string;
          stripe_checkout_session_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          project_id: string;
          purchased_at?: string;
          stripe_checkout_session_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          project_id?: string;
          purchased_at?: string;
          stripe_checkout_session_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_passes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_view_tokens: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          id: string;
          project_id: string;
          token: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          project_id: string;
          token: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          project_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_view_tokens_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          after_photo_storage_path: string | null;
          before_photo_storage_path: string | null;
          confidence_score: number | null;
          created_at: string;
          estimated_max_total: number | null;
          estimated_min_total: number | null;
          grounding_sources: Json | null;
          id: string;
          metadata: Json | null;
          name: string;
          owner_user_id: string | null;
          property_id: string;
          stage: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          after_photo_storage_path?: string | null;
          before_photo_storage_path?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          estimated_max_total?: number | null;
          estimated_min_total?: number | null;
          grounding_sources?: Json | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          owner_user_id?: string | null;
          property_id: string;
          stage?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          after_photo_storage_path?: string | null;
          before_photo_storage_path?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          estimated_max_total?: number | null;
          estimated_min_total?: number | null;
          grounding_sources?: Json | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          owner_user_id?: string | null;
          property_id?: string;
          stage?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          approximate_location: string | null;
          city: string;
          country: string;
          created_at: string;
          id: string;
          owner_user_id: string;
          postal_code: string;
          state: string;
          updated_at: string | null;
        };
        Insert: {
          approximate_location?: string | null;
          city?: string;
          country?: string;
          created_at?: string;
          id?: string;
          owner_user_id: string;
          postal_code: string;
          state?: string;
          updated_at?: string | null;
        };
        Update: {
          approximate_location?: string | null;
          city?: string;
          country?: string;
          created_at?: string;
          id?: string;
          owner_user_id?: string;
          postal_code?: string;
          state?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      revenuecat_webhook_events: {
        Row: {
          id: string;
          received_at: string;
        };
        Insert: {
          id: string;
          received_at?: string;
        };
        Update: {
          id?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      scope_items: {
        Row: {
          category: string;
          confidence_reason: string | null;
          confidence_score: number | null;
          created_at: string;
          description: string;
          finish_tier: string | null;
          id: string;
          justification: string | null;
          maintenance_tips: string | null;
          metadata: Json | null;
          owner_user_id: string | null;
          phase: string | null;
          priority: string | null;
          project_id: string;
          quantity: number | null;
          source: string | null;
          total_cost_max: number | null;
          total_cost_min: number | null;
          unit: string | null;
          unit_cost_max: number | null;
          unit_cost_min: number | null;
          updated_at: string | null;
          verification_required: boolean | null;
        };
        Insert: {
          category: string;
          confidence_reason?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          description?: string;
          finish_tier?: string | null;
          id?: string;
          justification?: string | null;
          maintenance_tips?: string | null;
          metadata?: Json | null;
          owner_user_id?: string | null;
          phase?: string | null;
          priority?: string | null;
          project_id: string;
          quantity?: number | null;
          source?: string | null;
          total_cost_max?: number | null;
          total_cost_min?: number | null;
          unit?: string | null;
          unit_cost_max?: number | null;
          unit_cost_min?: number | null;
          updated_at?: string | null;
          verification_required?: boolean | null;
        };
        Update: {
          category?: string;
          confidence_reason?: string | null;
          confidence_score?: number | null;
          created_at?: string;
          description?: string;
          finish_tier?: string | null;
          id?: string;
          justification?: string | null;
          maintenance_tips?: string | null;
          metadata?: Json | null;
          owner_user_id?: string | null;
          phase?: string | null;
          priority?: string | null;
          project_id?: string;
          quantity?: number | null;
          source?: string | null;
          total_cost_max?: number | null;
          total_cost_min?: number | null;
          unit?: string | null;
          unit_cost_max?: number | null;
          unit_cost_min?: number | null;
          updated_at?: string | null;
          verification_required?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "scope_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_packets: {
        Row: {
          created_at: string | null;
          generated_at: string | null;
          id: string;
          project_id: string;
          property_id: string;
          storage_path: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          project_id: string;
          property_id: string;
          storage_path?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          generated_at?: string | null;
          id?: string;
          project_id?: string;
          property_id?: string;
          storage_path?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seller_packets_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_packets_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          last_active_project_id: string | null;
          push_token: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          last_active_project_id?: string | null;
          push_token?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          last_active_project_id?: string | null;
          push_token?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_last_active_project_id_fkey";
            columns: ["last_active_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          id: string;
          invoice_uploads_count: number;
          invoice_uploads_reset_at: string | null;
          plan: string;
          revenuecat_entitlement_active: boolean;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          invoice_uploads_count?: number;
          invoice_uploads_reset_at?: string | null;
          plan?: string;
          revenuecat_entitlement_active?: boolean;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          invoice_uploads_count?: number;
          invoice_uploads_reset_at?: string | null;
          plan?: string;
          revenuecat_entitlement_active?: boolean;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_onboarding_sync_payload: { Args: { p_token: string }; Returns: Json };
      get_user_id_by_email: { Args: { user_email: string }; Returns: string };
      match_document_embeddings: {
        Args: {
          match_count: number;
          match_threshold: number;
          p_project_id: string;
          query_embedding: string;
        };
        Returns: {
          content: string;
          document_id: string;
          id: string;
          similarity: number;
        }[];
      };
      recalc_project_totals: { Args: { p_id: string }; Returns: undefined };
      release_architect_invoice_upload_slot: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      reserve_architect_invoice_upload_slot: {
        Args: { p_max_uploads?: number; p_user_id: string };
        Returns: {
          invoice_uploads_count: number;
          ok: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
