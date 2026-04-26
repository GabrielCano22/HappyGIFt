import { useEffect, useRef, useState } from 'react';
import type { TemplateSchema, AssetPackData } from '../../domain/template.types';
import { paintTemplate, formatBirthDateES, type PaintSlots } from './canvasDraw';

interface Props {
  schema: TemplateSchema;
  userInput: { name: string; birth_date: string };
  aiText?: string;
  aiBackgroundUrl?: string | null;
  userPhotoUrl?: string | null;
  assetPacks: AssetPackData[];
}

function resolveAsset(packs: AssetPackData[], packSlug?: string, assetId?: string) {
  const pack = packs.find(p => p.slug === packSlug);
  if (!pack) return null;
  return pack.assets.find(a => a.id === assetId) || pack.assets[0] || null;
}

export function CanvasRenderer({
  schema, userInput, aiText, aiBackgroundUrl, userPhotoUrl, assetPacks,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [repaintTick, setRepaintTick] = useState(0);

  // Load background image when URL changes.
  // No crossOrigin: we only display, never extract canvas pixels.
  useEffect(() => {
    if (!aiBackgroundUrl) { setBgImg(null); return; }
    const img = new Image();
    let cancelled = false;
    img.onload = () => { if (!cancelled) setBgImg(img); };
    img.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.warn('bg image load failed', aiBackgroundUrl, e);
      if (!cancelled) setBgImg(null);
    };
    img.src = aiBackgroundUrl;
    return () => { cancelled = true; };
  }, [aiBackgroundUrl]);

  // Load user photo when URL changes.
  useEffect(() => {
    if (!userPhotoUrl) { setPhotoImg(null); return; }
    const img = new Image();
    let cancelled = false;
    img.onload = () => { if (!cancelled) setPhotoImg(img); };
    img.onerror = () => { if (!cancelled) setPhotoImg(null); };
    img.src = userPhotoUrl;
    return () => { cancelled = true; };
  }, [userPhotoUrl]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const slots: PaintSlots = {};
    for (const layer of schema.layers) {
      const src = layer.source;
      if (src.kind === 'static') slots[layer.id] = src.value || '';
      else if (src.kind === 'user_input') {
        const f = src.field || layer.id;
        if (f === 'birth_date_formatted') {
          slots[layer.id] = formatBirthDateES(userInput.birth_date);
        } else {
          slots[layer.id] = (userInput as Record<string, string>)[f] || '';
        }
      }
      else if (src.kind === 'ai_text') slots[layer.id] = aiText || src.fallback || '';
      else if (src.kind === 'ai_background') slots[layer.id] = bgImg;
      else if (src.kind === 'user_photo') slots[layer.id] = photoImg;
      else if (src.kind === 'asset_pack') {
        const a = resolveAsset(assetPacks, src.pack, src.asset_id);
        slots[layer.id] = a ? { kind: a.kind, value: a.value } : null;
      }
    }
    const repaint = () => setRepaintTick(t => t + 1);
    paintTemplate(ctx, schema, slots, repaint);
  }, [schema, userInput, aiText, bgImg, photoImg, assetPacks, repaintTick]);

  return (
    <canvas
      ref={ref}
      width={schema.canvas.width}
      height={schema.canvas.height}
      style={{
        width: '100%',
        aspectRatio: `${schema.canvas.width} / ${schema.canvas.height}`,
        display: 'block',
        borderRadius: 12,
        background: '#000',
      }}
    />
  );
}
