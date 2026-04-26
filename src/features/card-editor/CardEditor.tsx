import { useEffect, useRef, useState } from 'react';
import type { TemplateDetail, AssetPackData } from '../../domain/template.types';
import type { CardDraft, RenderedCard, Tone } from '../../domain/card.types';
import { templateService } from '../../services/templateService';
import { aiService } from '../../services/aiService';
import { renderService } from '../../services/renderService';
import { CanvasRenderer } from '../live-preview/CanvasRenderer';
import { ResultPanel } from '../result/ResultPanel';
import { PhotoUpload } from './PhotoUpload';

interface Props {
  templateSlug: string;
  onBack: () => void;
}

const TONES: { id: Tone; label: string }[] = [
  { id: 'warm',      label: 'Cálido' },
  { id: 'playful',   label: 'Juguetón' },
  { id: 'formal',    label: 'Formal' },
  { id: 'poetic',    label: 'Poético' },
  { id: 'inspiring', label: 'Inspirador' },
];

export function CardEditor({ templateSlug, onBack }: Props) {
  const [tpl, setTpl] = useState<TemplateDetail | null>(null);
  const [packs, setPacks] = useState<AssetPackData[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [tone, setTone] = useState<Tone>('warm');
  const [aiText, setAiText] = useState('');
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [aiBgPath, setAiBgPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [textProvider, setTextProvider] = useState('');
  const [bgProvider, setBgProvider] = useState('');
  const [effect, setEffect] = useState<string>('float');

  // ui state
  const [genTextLoading, setGenTextLoading] = useState(false);
  const [genBgLoading, setGenBgLoading] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderedCard | null>(null);
  const bgAbortRef = useRef<AbortController | null>(null);
  const textAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.all([
      templateService.detail(templateSlug),
      templateService.assetPacks(),
    ]).then(([t, p]) => {
      setTpl(t);
      setPacks(p.results);
      setEffect(t.schema.effects?.default || 'float');
    }).catch(e => setLoadError(String(e)));
  }, [templateSlug]);

  // Abort pending requests on unmount. MUST be declared before any
  // conditional return — hook order must be stable across renders.
  useEffect(() => () => {
    bgAbortRef.current?.abort();
    textAbortRef.current?.abort();
  }, []);

  if (loadError) return <p style={{ color: 'var(--pink)' }}>Error: {loadError}</p>;
  if (!tpl) return <p style={{ color: 'var(--text-muted)' }}>Cargando plantilla…</p>;

  const canRender = !!name.trim() && !!date && !renderLoading;

  const handleGenText = async () => {
    if (!name.trim()) {
      setError('Escribe un nombre primero');
      return;
    }
    textAbortRef.current?.abort();
    const ac = new AbortController();
    textAbortRef.current = ac;
    setError(null); setGenTextLoading(true);
    try {
      const r = await aiService.generateText({
        name: name.trim(), tone, language: 'es', max_chars: 180,
      }, ac.signal);
      setAiText(r.text);
      setTextProvider(r.provider);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error generando texto');
    } finally {
      if (textAbortRef.current === ac) {
        setGenTextLoading(false);
        textAbortRef.current = null;
      }
    }
  };

  const handleGenBg = async (vary = false) => {
    // Cancel any in-flight bg request before starting new one.
    bgAbortRef.current?.abort();
    const ac = new AbortController();
    bgAbortRef.current = ac;
    setError(null); setGenBgLoading(true);
    // Clear current bg immediately so UI shows "regenerating" state.
    if (vary) {
      setAiBgUrl(null);
      setAiBgPath(null);
    }
    try {
      const palette = Object.values(tpl.schema.palette).slice(0, 3);
      const r = await aiService.generateBackground({
        palette, mood: 'festive', vary,
        // Smaller size = much faster (5-10s vs 30-60s).
        width: 768, height: 768,
      }, ac.signal);
      // Append cache-buster so browser/CanvasRenderer reload image.
      const bust = `${r.url}${r.url.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setAiBgUrl(bust);
      setAiBgPath(r.storage_path);
      setBgProvider(r.provider);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Error generando fondo');
    } finally {
      if (bgAbortRef.current === ac) {
        setGenBgLoading(false);
        bgAbortRef.current = null;
      }
    }
  };

  const handleRender = async () => {
    if (!canRender) return;
    setError(null); setRenderLoading(true);
    const draft: CardDraft = {
      template_slug: templateSlug,
      user_input: { name: name.trim(), birth_date: date, tone, language: 'es' },
      ai_text: aiText,
      ai_background_url: aiBgUrl,
      ai_background_storage_path: aiBgPath,
      user_photo_url: photoUrl,
      user_photo_storage_path: photoPath,
      layer_overrides: {},
      effect,
      text_provider: textProvider,
      bg_provider: bgProvider,
    };
    try {
      const card = await renderService.render(draft);
      setResult(card);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al renderizar');
    } finally {
      setRenderLoading(false);
    }
  };

  if (result) {
    return <ResultPanel card={result} onNew={onBack} />;
  }

  const effects = tpl.schema.effects?.available || ['float', 'none'];
  const needsPhoto = tpl.schema.layers.some(l => l.source.kind === 'user_photo');
  const usesAiText = tpl.schema.layers.some(l => l.source.kind === 'ai_text');
  const usesAiBg = tpl.schema.layers.some(l => l.source.kind === 'ai_background');

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(320px, 460px) minmax(320px, 1fr)',
      gap: 24, alignItems: 'start',
    }}>
      {/* Left: controls */}
      <div className="glass" style={{
        padding: 22,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <button
          onClick={onBack}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', borderRadius: 8,
            padding: '4px 12px', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11,
          }}
        >← Cambiar plantilla</button>

        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{tpl.name}</h2>

        <Field label="Nombre del festejado *">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. María García"
            maxLength={30}
            className="input"
          />
        </Field>

        <Field label="Fecha de cumpleaños *">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
            style={{ colorScheme: 'dark' }}
          />
        </Field>

        <Field label="Tono del mensaje IA">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TONES.map(t => (
              <button
                key={t.id}
                className={`chip ${tone === t.id ? 'is-active' : ''}`}
                onClick={() => setTone(t.id)}
              >{t.label}</button>
            ))}
          </div>
        </Field>

        {usesAiText && (
          <div style={{
            background: 'var(--surface2)', borderRadius: 10,
            padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--text-dim)',
            }}>
              <span>MENSAJE IA</span>
              <button
                onClick={handleGenText}
                disabled={genTextLoading || !name.trim()}
                style={smallBtn(!genTextLoading && !!name.trim())}
              >
                {genTextLoading ? '…' : aiText ? '🔄 Regenerar' : '✦ Generar'}
              </button>
            </div>
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              placeholder="Click 'Generar' o escribe tu propio mensaje"
              maxLength={320}
              rows={3}
              className="input"
              style={{ fontSize: 13, resize: 'vertical', minHeight: 70 }}
            />
          </div>
        )}

        {needsPhoto && (
          <PhotoUpload
            url={photoUrl}
            onUploaded={(u, p) => { setPhotoUrl(u); setPhotoPath(p); }}
            onClear={() => { setPhotoUrl(null); setPhotoPath(null); }}
          />
        )}

        {usesAiBg && (
          <div style={{
            background: 'var(--surface2)', borderRadius: 10,
            padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--text-dim)',
            }}>
              <span>FONDO IA (opcional · ~5-10s)</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {aiBgUrl && (
                  <button
                    onClick={() => { setAiBgUrl(null); setAiBgPath(null); }}
                    style={smallBtn(true, true)}
                  >Quitar</button>
                )}
                <button
                  onClick={() => handleGenBg(!!aiBgUrl)}
                  disabled={genBgLoading}
                  style={smallBtn(!genBgLoading)}
                >
                  {genBgLoading ? '…' : aiBgUrl ? '🎲 Otro' : '✦ Generar'}
                </button>
              </div>
            </div>
            {genBgLoading
              ? <div style={{
                  fontSize: 11, color: 'var(--gold)',
                  fontFamily: 'var(--mono)', padding: '6px 0',
                }}>Generando fondo… (cancela auto si pides otro)</div>
              : aiBgUrl
                ? <img
                    key={aiBgUrl}
                    src={aiBgUrl}
                    alt="bg"
                    style={{ width: '100%', borderRadius: 6 }}
                  />
                : <div style={{
                    fontSize: 11, color: 'var(--text-muted)',
                    fontFamily: 'var(--mono)', padding: '6px 0',
                  }}>Sin fondo IA. Se usará color sólido.</div>}
          </div>
        )}

        <Field label="Efecto de animación">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {effects.map(e => (
              <button
                key={e}
                className={`chip ${effect === e ? 'is-active' : ''}`}
                onClick={() => setEffect(e)}
              >{e}</button>
            ))}
          </div>
        </Field>

        <button
          className="btn-primary"
          onClick={handleRender}
          disabled={!canRender}
          style={{ padding: '14px', fontSize: 15 }}
        >
          {renderLoading ? 'Generando GIF…' : '🎁 Crear tarjeta'}
        </button>

        {error && (
          <div style={{
            padding: 10, background: 'oklch(25% 0.10 20)',
            border: '1px solid var(--pink)', borderRadius: 8,
            color: 'var(--pink)', fontFamily: 'var(--mono)', fontSize: 11,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 180, overflowY: 'auto',
          }}>{error}</div>
        )}
      </div>

      {/* Right: preview */}
      <div className="glass" style={{
        padding: 22,
        position: 'sticky', top: 24,
      }}>
        <div style={{
          fontSize: 11, fontFamily: 'var(--mono)',
          color: 'var(--text-muted)', textTransform: 'uppercase',
          letterSpacing: '0.15em', marginBottom: 12,
        }}>Vista previa en vivo (canvas)</div>
        <CanvasRenderer
          schema={tpl.schema}
          userInput={{ name: name || 'Tu nombre', birth_date: date }}
          aiText={aiText}
          aiBackgroundUrl={aiBgUrl}
          userPhotoUrl={photoUrl}
          assetPacks={packs}
        />
        <div style={{
          marginTop: 10, fontSize: 11,
          fontFamily: 'var(--mono)', color: 'var(--text-muted)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{tpl.schema.canvas.width}×{tpl.schema.canvas.height}</span>
          <span>{textProvider || 'sin IA texto'} · {bgProvider || 'sin IA fondo'}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12,
        color: 'var(--text-dim)', marginBottom: 6,
        fontFamily: 'var(--mono)', textTransform: 'uppercase',
        letterSpacing: 1,
      }}>{label}</label>
      {children}
    </div>
  );
}

function smallBtn(active: boolean, danger = false): React.CSSProperties {
  return {
    padding: '4px 10px',
    background: active ? (danger ? 'var(--pink)' : 'var(--gold)') : 'var(--surface)',
    color: active ? '#0d0e12' : 'var(--text-muted)',
    border: 'none', borderRadius: 6,
    fontFamily: 'var(--mono)', fontSize: 10,
    cursor: active ? 'pointer' : 'not-allowed',
    fontWeight: 700,
  };
}
