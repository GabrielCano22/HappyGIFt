export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* keep raw */ }
    // Si el backend devolvió un JSON con error/detail, lo mostramos
    // limpio. Si no, devolvemos el texto crudo recortado.
    if (parsed && typeof parsed === 'object') {
      const o = parsed as Record<string, unknown>;
      const detail = o.detail || o.error || JSON.stringify(o);
      throw new Error(`API ${res.status}: ${detail}`);
    }
    throw new Error(`API ${res.status}: ${String(parsed).slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}
