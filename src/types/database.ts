export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      access_status: "ativo" | "pendente" | "expirado" | "cancelado" | "reembolsado";
      activity_level: "sedentario" | "baixo" | "moderado" | "alto" | "muito_alto";
      biological_sex: "homem" | "mulher" | "indefinido";
      dietitian_status_type:
        | "pendente"
        | "cadastrado"
        | "plano_liberado"
        | "revisao_necessaria";
      review_status: "sem_revisao" | "revisao_recomendada" | "revisao_necessaria";
      plan_curation_status: "pendente" | "aprovado" | "revisar";
      user_role: "participant" | "admin";
    };
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          whatsapp: string | null;
          role: Database["public"]["Enums"]["user_role"];
          access_status: Database["public"]["Enums"]["access_status"];
          access_starts_at: string | null;
          access_expires_at: string | null;
          must_change_password: boolean;
          purchase_source: string | null;
          transaction_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          whatsapp?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          access_status?: Database["public"]["Enums"]["access_status"];
          access_starts_at?: string | null;
          access_expires_at?: string | null;
          must_change_password?: boolean;
          purchase_source?: string | null;
          transaction_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      anamneses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          age: number;
          biological_sex: Database["public"]["Enums"]["biological_sex"];
          weight_kg: number;
          height_cm: number;
          main_goal: string;
          weight_loss_history: string | null;
          main_difficulty: string | null;
          activity_level: Database["public"]["Enums"]["activity_level"];
          sleep_hours: string | null;
          sleep_quality: string | null;
          health_conditions: string[];
          food_preference: string;
          motivation: number;
          behavioral_answers: Json;
          raw_answers: Json;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["anamneses"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["anamneses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "anamneses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      metabolic_calculations: {
        Row: {
          id: string;
          user_id: string;
          anamnese_id: string;
          basal_metabolic_rate: number | null;
          total_energy_expenditure: number | null;
          activity_factor: number;
          cut_target_calories: number | null;
          indicated_plan_id: string | null;
          indicated_plan_code: string | null;
          estimated_deficit: number | null;
          equation_name: string;
          review_status: Database["public"]["Enums"]["review_status"];
          review_reasons: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anamnese_id: string;
          basal_metabolic_rate?: number | null;
          total_energy_expenditure?: number | null;
          activity_factor: number;
          cut_target_calories?: number | null;
          indicated_plan_id?: string | null;
          indicated_plan_code?: string | null;
          estimated_deficit?: number | null;
          equation_name?: string;
          review_status?: Database["public"]["Enums"]["review_status"];
          review_reasons?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["metabolic_calculations"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "metabolic_calculations_anamnese_id_fkey";
            columns: ["anamnese_id"];
            isOneToOne: false;
            referencedRelation: "anamneses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "metabolic_calculations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      physical_assessments: {
        Row: {
          id: string;
          user_id: string;
          week: number;
          weight_kg: number | null;
          waist_cm: number | null;
          abdomen_cm: number | null;
          arm_cm: number | null;
          thigh_cm: number | null;
          neck_cm: number | null;
          calf_cm: number | null;
          notes: string | null;
          front_photo_url: string | null;
          side_photo_url: string | null;
          back_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week: number;
          weight_kg?: number | null;
          waist_cm?: number | null;
          abdomen_cm?: number | null;
          arm_cm?: number | null;
          thigh_cm?: number | null;
          neck_cm?: number | null;
          calf_cm?: number | null;
          notes?: string | null;
          front_photo_url?: string | null;
          side_photo_url?: string | null;
          back_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["physical_assessments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "physical_assessments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      plan_curations: {
        Row: {
          id: string;
          user_id: string;
          calculation_id: string | null;
          suggested_plan_code: string | null;
          approved_plan_code: string | null;
          status: Database["public"]["Enums"]["plan_curation_status"];
          admin_observation: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calculation_id?: string | null;
          suggested_plan_code?: string | null;
          approved_plan_code?: string | null;
          status?: Database["public"]["Enums"]["plan_curation_status"];
          admin_observation?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_curations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "plan_curations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      operation_trails: {
        Row: {
          id: string;
          user_id: string;
          anamnese_id: string;
          calculation_id: string | null;
          pdf_url: string | null;
          priorities: Json;
          recommended_materials: Json;
          generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          anamnese_id: string;
          calculation_id?: string | null;
          pdf_url?: string | null;
          priorities?: Json;
          recommended_materials?: Json;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operation_trails"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "operation_trails_anamnese_id_fkey";
            columns: ["anamnese_id"];
            isOneToOne: false;
            referencedRelation: "anamneses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operation_trails_calculation_id_fkey";
            columns: ["calculation_id"];
            isOneToOne: false;
            referencedRelation: "metabolic_calculations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operation_trails_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
