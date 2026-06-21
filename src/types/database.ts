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
          purchase_source?: string | null;
          transaction_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
      };
    };
  };
};
