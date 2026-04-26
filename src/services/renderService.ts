import { http, API_BASE } from './http';
import type { CardDraft, RenderedCard } from '../domain/card.types';

export const renderService = {
  render(draft: CardDraft): Promise<RenderedCard> {
    return http('/cards/render/', {
      method: 'POST',
      body: JSON.stringify({
        template_slug: draft.template_slug,
        user_input: draft.user_input,
        ai_text: draft.ai_text,
        ai_background_storage_path: draft.ai_background_storage_path,
        user_photo_storage_path: draft.user_photo_storage_path,
        layer_overrides: draft.layer_overrides,
        effect: draft.effect,
        text_provider: draft.text_provider,
        bg_provider: draft.bg_provider,
      }),
    });
  },

  /** Returns Blob URL for a server-rendered preview PNG. */
  async previewPng(draft: CardDraft): Promise<string> {
    const res = await fetch(`${API_BASE}/cards/preview/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_slug: draft.template_slug,
        user_input: draft.user_input,
        ai_text: draft.ai_text,
        ai_background_storage_path: draft.ai_background_storage_path,
        user_photo_storage_path: draft.user_photo_storage_path,
        layer_overrides: draft.layer_overrides,
      }),
    });
    if (!res.ok) throw new Error(`preview ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async download(url: string, filename: string): Promise<void> {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  },
};
