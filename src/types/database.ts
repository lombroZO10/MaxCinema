export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      movies: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          type: "movie" | "series";
          poster_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
          mux_playback_id: string | null;
          release_year: number | null;
          duration_minutes: number | null;
          maturity_rating: string | null;
          featured: boolean;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          type?: "movie" | "series";
          poster_url?: string | null;
          backdrop_url?: string | null;
          trailer_url?: string | null;
          mux_playback_id?: string | null;
          release_year?: number | null;
          duration_minutes?: number | null;
          maturity_rating?: string | null;
          featured?: boolean;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["movies"]["Insert"]>;
      };
      genres: {
        Row: { id: string; name: string; slug: string };
        Insert: { id?: string; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["genres"]["Insert"]>;
      };
      movie_genres: {
        Row: { movie_id: string; genre_id: string };
        Insert: { movie_id: string; genre_id: string };
        Update: Partial<Database["public"]["Tables"]["movie_genres"]["Insert"]>;
      };
      favorites: {
        Row: { id: string; user_id: string; movie_id: string; created_at: string };
        Insert: { id?: string; user_id: string; movie_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
      };
      watch_progress: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string;
          progress_seconds: number;
          duration_seconds: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: string;
          progress_seconds?: number;
          duration_seconds?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["watch_progress"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: "stripe" | "mercado_pago";
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "stripe" | "mercado_pago";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      seasons: {
        Row: {
          id: string;
          movie_id: string;
          season_number: number;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          movie_id: string;
          season_number: number;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seasons"]["Insert"]>;
      };
      episodes: {
        Row: {
          id: string;
          season_id: string;
          title: string;
          description: string | null;
          episode_number: number;
          duration_minutes: number | null;
          poster_url: string | null;
          mux_playback_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          title: string;
          description?: string | null;
          episode_number: number;
          duration_minutes?: number | null;
          poster_url?: string | null;
          mux_playback_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["episodes"]["Insert"]>;
      };
    };
  };
};
