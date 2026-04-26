import { API_BASE } from './http';

export interface PhotoUploadResponse {
  url: string;
  storage_path: string;
}

export const photoService = {
  async upload(file: File, signal?: AbortSignal): Promise<PhotoUploadResponse> {
    const fd = new FormData();
    fd.append('photo', file);
    const res = await fetch(`${API_BASE}/cards/upload-photo/`, {
      method: 'POST',
      body: fd,
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      let detail: string = text;
      try {
        const obj = JSON.parse(text);
        detail = obj.detail || obj.error || text;
      } catch { /* keep raw */ }
      throw new Error(`Upload ${res.status}: ${detail}`);
    }
    return res.json();
  },
};
