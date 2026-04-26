export type Tone = 'warm' | 'playful' | 'formal' | 'poetic' | 'inspiring';

export interface UserInput {
  name: string;
  birth_date: string;
  tone?: Tone;
  language?: 'es' | 'en';
}

export interface CardDraft {
  template_slug: string;
  user_input: UserInput;
  ai_text: string;
  ai_background_url: string | null;
  ai_background_storage_path: string | null;
  user_photo_url: string | null;
  user_photo_storage_path: string | null;
  layer_overrides: Record<string, string>;
  effect: string;
  text_provider: string;
  bg_provider: string;
}

export interface RenderedCard {
  id: string;
  template_slug: string;
  template_version: number;
  user_input: UserInput;
  ai_text: string;
  ai_background_url: string | null;
  ai_stickers: { slot: string; asset_id: string }[];
  layer_overrides: Record<string, string>;
  effect: string;
  text_provider: string;
  bg_provider: string;
  gif_url: string;
  png_url: string;
  download_url: string;
  download_png_url: string;
  created_at: string;
}
