export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AcervoContentRow = {
  id: string;
  data: Json;
  created_at: string;
  updated_at: string;
} & Record<string, unknown>;

type AcervoContentInsert = {
  id?: string;
  data: Json;
  created_at?: string;
  updated_at?: string;
} & Record<string, unknown>;

type AcervoContentUpdate = {
  id?: string;
  data?: Json;
  created_at?: string;
  updated_at?: string;
} & Record<string, unknown>;

export type Database = {
  public: {
    Tables: {
      acervo_content: {
        Row: AcervoContentRow;
        Insert: AcervoContentInsert;
        Update: AcervoContentUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
