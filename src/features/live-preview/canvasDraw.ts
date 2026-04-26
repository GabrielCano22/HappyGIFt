/* Renderer de plantillas del lado del cliente. Es el espejo de
   renderer.py del backend: toma el mismo schema y los mismos slots y los
   pinta directo sobre un CanvasRenderingContext2D.

   Vivir con dos renderers (cliente y servidor) tiene un costo, pero a
   cambio puedo mostrar el preview en vivo sin tocar el backend en cada
   keystroke. La función es pura: misma entrada, mismo dibujo.
*/

import type { TemplateSchema, Layer, TextStyle, ShapeStyle } from '../../domain/template.types';

export interface PaintSlots {
  [layerId: string]:
    | string                                  // text or simple value
    | { kind: string; value?: string; url?: string } // asset
    | HTMLImageElement                        // bg image
    | null
    | undefined;
}

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio',
                    'julio','agosto','septiembre','octubre','noviembre','diciembre'];

export function formatBirthDateES(iso: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  return `${d} de ${MONTHS_ES[mo - 1]} de ${y}`;
}

function resolvePaletteColor(value: string | undefined, palette: Record<string, string>): string {
  if (!value) return '#ffffff';
  const m = /^\{\{palette\.(\w+)\}\}$/.exec(value);
  if (m) return palette[m[1]] || '#ffffff';
  return value;
}

function applyOpacity(ctx: CanvasRenderingContext2D, opacity: number, fn: () => void) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = opacity;
  try { fn(); } finally { ctx.globalAlpha = prev; }
}

function drawShapeLayer(ctx: CanvasRenderingContext2D, layer: Layer, palette: Record<string, string>) {
  const style = (layer.style || {}) as ShapeStyle;
  const fill = resolvePaletteColor(style.fill, palette);
  const r = style.radius || 0;
  const { x, y, w = 100, h = 100 } = layer.rect;
  ctx.fillStyle = fill;
  if (r > 0) {
    roundedRect(ctx, x, y, w, h, r);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  value: string,
  palette: Record<string, string>,
) {
  if (!value) return;
  const style = (layer.style || { size: 24 }) as TextStyle;
  const size = style.size;
  const family = style.font || 'Space Grotesk';
  const weight = style.weight || 400;
  ctx.font = `${weight} ${size}px "${family}", sans-serif`;
  ctx.fillStyle = resolvePaletteColor(style.color, palette);
  const align = style.align || 'left';
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const maxW = layer.rect.w || ctx.canvas.width;
  const lines = layer.wrap ? wrapText(ctx, value, maxW) : [value];
  const lineH = size * (style.line_height || 1.25);

  let { x, y } = layer.rect;
  if (align === 'center') x = (layer.rect.x);
  // For canvas with align='center' we pass center x, then x is reused below

  if (style.shadow) {
    const sc = resolvePaletteColor(style.shadow.color, palette);
    ctx.fillStyle = sc;
    for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2]]) {
      let yy = y;
      for (const line of lines) {
        ctx.fillText(line, x + dx, yy + dy);
        yy += lineH;
      }
    }
  }
  ctx.fillStyle = resolvePaletteColor(style.color, palette);
  let yy = y;
  for (const line of lines) {
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  if (!words.length) return [''];
  const lines: string[] = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const trial = cur + ' ' + words[i];
    if (ctx.measureText(trial).width <= maxW) cur = trial;
    else { lines.push(cur); cur = words[i]; }
  }
  lines.push(cur);
  return lines;
}

// Twemoji client cache
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';
const emojiCache = new Map<string, HTMLImageElement>();

function emojiCodepoint(emoji: string): string {
  const parts: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp == null || cp === 0xfe0f) continue;
    parts.push(cp.toString(16));
  }
  return parts.join('-');
}

export function getEmojiImage(emoji: string, onLoad?: () => void): HTMLImageElement | null {
  if (!emoji) return null;
  const cp = emojiCodepoint(emoji);
  if (!cp) return null;
  const cached = emojiCache.get(cp);
  if (cached) return cached;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  // Set handler BEFORE src so cached browser responses still fire onload.
  if (onLoad) img.onload = onLoad;
  img.src = `${TWEMOJI_BASE}/${cp}.png`;
  emojiCache.set(cp, img);
  return img;
}

function drawAssetLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  asset: { kind: string; value?: string } | null | undefined,
  repaint?: () => void,
) {
  if (!asset || asset.kind !== 'emoji' || !asset.value) return;
  const { x, y, w = 100, h = 100 } = layer.rect;
  const img = getEmojiImage(asset.value, repaint);
  if (!img || !img.complete || !img.naturalWidth) return;
  const size = Math.min(w, h);
  const ox = x + (w - size) / 2;
  const oy = y + (h - size) / 2;
  ctx.drawImage(img, ox, oy, size, size);
}

function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  img: HTMLImageElement | null | undefined,
  palette: Record<string, string>,
) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const { x, y, w = ctx.canvas.width, h = ctx.canvas.height } = layer.rect;
  const opacity = layer.opacity ?? 1;
  const shape = layer.shape;
  const border = layer.border;

  applyOpacity(ctx, opacity, () => {
    ctx.save();
    // Clip path
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (typeof shape === 'object' && shape?.kind === 'rounded') {
      const r = shape.radius || 16;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.closePath();
    ctx.clip();

    // cover fit
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const nw = img.naturalWidth * scale;
    const nh = img.naturalHeight * scale;
    const ox = x - (nw - w) / 2;
    const oy = y - (nh - h) / 2;

    if (layer.filters?.some(f => f.type === 'blur')) {
      ctx.filter = `blur(${layer.filters.find(f => f.type === 'blur')?.radius || 4}px)`;
    }
    ctx.drawImage(img, ox, oy, nw, nh);
    ctx.filter = 'none';
    ctx.restore();

    const darken = layer.filters?.find(f => f.type === 'darken');
    if (darken) {
      ctx.fillStyle = `rgba(0,0,0,${darken.amount || 0.3})`;
      ctx.save();
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.closePath();
      ctx.clip();
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }

    // Border (drawn after image)
    if (border) {
      ctx.lineWidth = border.width || 4;
      ctx.strokeStyle = resolvePaletteColor(border.color, palette);
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.closePath();
      ctx.stroke();
    }
  });
}

export function paintTemplate(
  ctx: CanvasRenderingContext2D,
  schema: TemplateSchema,
  slots: PaintSlots,
  repaint?: () => void,
) {
  const palette = schema.palette || {};
  const bg = resolvePaletteColor(schema.canvas.background, palette);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, schema.canvas.width, schema.canvas.height);

  for (const layer of schema.layers) {
    const value = slots[layer.id];
    if (layer.type === 'image') {
      drawImageLayer(ctx, layer, value as HTMLImageElement, palette);
    } else if (layer.type === 'text') {
      drawTextLayer(ctx, layer, (value as string) || '', palette);
    } else if (layer.type === 'asset') {
      drawAssetLayer(ctx, layer, value as { kind: string; value?: string }, repaint);
    } else if (layer.type === 'shape') {
      drawShapeLayer(ctx, layer, palette);
    }
  }
}
