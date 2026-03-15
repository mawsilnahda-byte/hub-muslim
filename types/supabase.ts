export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferred_locale: string
          preferred_reciter_slug: string
          arabic_font_size: string
          show_translation: boolean
          is_premium: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      surahs: {
        Row: {
          id: number
          name_arabic: string
          name_transliteration: string
          name_en: string
          name_fr: string
          revelation_type: string
          ayah_count: number
          juz_start: number
          page_start: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['surahs']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['surahs']['Insert']>
      }
      ayahs: {
        Row: {
          id: string
          surah_id: number
          ayah_number: number
          ayah_number_global: number
          text_uthmani: string
          juz: number
          hizb: number | null
          page: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ayahs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ayahs']['Insert']>
      }
      translations: {
        Row: {
          id: string
          ayah_id: string
          translator_id: string
          language_code: string
          text: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['translations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['translations']['Insert']>
      }
      translators: {
        Row: {
          id: string
          slug: string
          name: string
          language_code: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['translators']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['translators']['Insert']>
      }
      reciters: {
        Row: {
          id: string
          slug: string
          name: string
          audio_base_url: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reciters']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reciters']['Insert']>
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          ayah_id: string
          surah_id: number
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookmarks']['Insert']>
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          surah_id: number
          last_ayah_id: string | null
          last_ayah_number: number
          completed: boolean
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reading_progress']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['reading_progress']['Insert']>
      }
      reading_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          total_ayahs_read: number
          last_read_date: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reading_streaks']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['reading_streaks']['Insert']>
      }
      feature_flags: {
        Row: {
          id: string
          key: string
          is_enabled: boolean
          is_premium_only: boolean
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feature_flags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>
      }
    }
  }
}
