import { useState } from 'react';
import type { RenderedCard } from '../../domain/card.types';
import { renderService } from '../../services/renderService';

interface Props {
  card: RenderedCard;
  onNew: () => void;
}

export function ResultPanel({ card, onNew }: Props) {
  const [copied, setCopied] = useState(false);
  const safe = card.user_input.name.toLowerCase().replace(/\s+/g, '_');

  const dl = async (fmt: 'gif' | 'png') => {
    const url = fmt === 'png' ? card.download_png_url : card.download_url;
    await renderService.download(url, `happygift_${safe}.${fmt}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(card.gif_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="glass" style={{
      maxWidth: 720, margin: '0 auto',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>¡Tarjeta lista!</h2>

      <img
        src={card.gif_url}
        alt={`Tarjeta de ${card.user_input.name}`}
        style={{
          maxWidth: '100%', borderRadius: 12,
          border: '1px solid var(--border)',
          marginBottom: 20,
        }}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10,
      }}>
        <button className="btn-primary" onClick={() => dl('gif')}>💾 Descargar GIF</button>
        <button className="btn-ghost"   onClick={() => dl('png')}>🖼 Descargar PNG</button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
      }}>
        <button className="btn-ghost" onClick={copyLink}>
          {copied ? '✓ Copiado' : '🔗 Copiar link'}
        </button>
        <button className="btn-ghost" onClick={onNew}>✦ Nueva tarjeta</button>
      </div>

      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)',
        textAlign: 'left', background: 'var(--surface2)',
        padding: 12, borderRadius: 8, lineHeight: 1.7,
      }}>
        <div>plantilla: <span style={{ color: 'var(--teal)' }}>{card.template_slug}</span></div>
        <div>texto: <span style={{ color: 'var(--gold)' }}>{card.text_provider || '—'}</span></div>
        <div>fondo: <span style={{ color: 'var(--gold)' }}>{card.bg_provider || '—'}</span></div>
        <div>efecto: <span style={{ color: 'var(--teal)' }}>{card.effect}</span></div>
      </div>
    </div>
  );
}

