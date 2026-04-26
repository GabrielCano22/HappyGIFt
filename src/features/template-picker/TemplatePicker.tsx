import { useEffect, useState } from 'react';
import type { TemplateSummary } from '../../domain/template.types';
import { templateService } from '../../services/templateService';

interface Props {
  onPick: (slug: string) => void;
}

const TEMPLATE_GLYPHS: Record<string, string> = {
  'birthday-classic-pastel': '🎂',
  'birthday-neon-party':     '✨',
  'birthday-minimal-white':  '⬜',
  'birthday-photo-portrait': '📸',
};

export function TemplatePicker({ onPick }: Props) {
  const [items, setItems] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    templateService.list('birthday')
      .then(r => { setItems(r.results); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Cargando plantillas…</p>;
  if (error) return <p style={{ color: 'var(--pink)', textAlign: 'center' }}>Error: {error}</p>;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 18, gap: 12, flexWrap: 'wrap',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>
          1. Elige una plantilla
        </h2>
        <div style={{
          fontSize: 11, fontFamily: 'var(--mono)',
          color: 'var(--text-muted)',
        }}>
          {items.length} disponibles
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {items.map(t => (
          <button
            key={t.id}
            className="glow-card spotlight"
            onClick={() => onPick(t.slug)}
            onMouseMove={e => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
            aria-label={`Elegir plantilla ${t.name}`}
            style={{
              padding: 18,
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 180,
              fontFamily: 'var(--sans)',
            }}
          >
            <div style={{
              height: 90,
              background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38,
              border: '1px solid var(--border)',
            }}>
              {t.thumbnail_url
                ? <img src={t.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                : (TEMPLATE_GLYPHS[t.slug] || '🎉')}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
            <div style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontFamily: 'var(--mono)', lineHeight: 1.5,
            }}>
              {t.description}
            </div>
            <div style={{
              marginTop: 'auto',
              fontSize: 10, fontFamily: 'var(--mono)',
              color: 'var(--text-dim)', letterSpacing: 1,
              textTransform: 'uppercase',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>v{t.version}</span>
              <span style={{
                color: 'var(--gold)',
                opacity: 0.8,
              }}>elegir →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
