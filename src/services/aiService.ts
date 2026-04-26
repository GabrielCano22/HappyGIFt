import { http } from './http';

export interface TextGenRequest {
  name: string;
  tone?: string;
  language?: string;
  max_chars?: number;
}

export interface TextGenResponse {
  text: string;
  provider: string;
}

export interface BackgroundGenRequest {
  palette?: string[];
  mood?: string;
  width?: number;
  height?: number;
  vary?: boolean;
}

export interface BackgroundGenResponse {
  url: string;
  storage_path: string;
  provider: string;
}

export const aiService = {
  generateText(req: TextGenRequest, signal?: AbortSignal): Promise<TextGenResponse> {
    return http('/ai/text/', {
      method: 'POST',
      body: JSON.stringify(req),
      signal,
    });
  },
  generateBackground(req: BackgroundGenRequest, signal?: AbortSignal): Promise<BackgroundGenResponse> {
    return http('/ai/background/', {
      method: 'POST',
      body: JSON.stringify(req),
      signal,
    });
  },
};
