import { useCallback, useRef, useState } from 'react';
import { photoService } from '../../services/photoService';

interface Props {
  url: string | null;
  onUploaded: (url: string, storagePath: string) => void;
  onClear: () => void;
}

export function PhotoUpload({ url, onUploaded, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    if (!f.type.startsWith('image/')) {
      setError('No es una imagen'); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Máximo 10MB'); return;
    }
    setBusy(true);
    try {
      const r = await photoService.upload(f);
      onUploaded(r.url, r.storage_path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setBusy(false);
    }
  }, [onUploaded]);

  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 10,
      padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 12, fontWeight: 700, color: 'var(--text-dim)',
      }}>
        <span>FOTO DE LA PERSONA</span>
        {url && (
          <button
            onClick={onClear}
            style={{
              padding: '4px 10px', background: 'var(--pink)',
              color: '#0d0e12', border: 'none', borderRadius: 6,
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Quitar</button>
        )}
      </div>

      {url ? (
        <img
          src={url}
          alt="foto subida"
          style={{
            width: '100%', maxHeight: 220, objectFit: 'contain',
            borderRadius: 8, background: 'var(--surface)',
          }}
        />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault(); setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          style={{
            border: `2px dashed ${drag ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: 10, padding: 20, textAlign: 'center',
            cursor: busy ? 'wait' : 'pointer',
            background: drag ? 'var(--surface)' : 'transparent',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {busy ? 'Subiendo…' : 'Arrastra una foto o haz click'}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-muted)',
            fontFamily: 'var(--mono)', marginTop: 4,
          }}>JPG / PNG / WEBP · max 10MB</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {error && (
        <div style={{
          color: 'var(--pink)', fontSize: 11,
          fontFamily: 'var(--mono)',
        }}>{error}</div>
      )}
    </div>
  );
}
