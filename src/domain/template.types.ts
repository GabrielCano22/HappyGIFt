// Template schema types — mirror backend cards.services.template_engine

export type LayerType = 'image' | 'asset' | 'text' | 'shape';

export type SourceKind =
  | 'static'
  | 'user_input'
  | 'asset_pack'
  | 'ai_text'
  | 'ai_background'
  | 'ai_sticker'
  | 'user_photo';

export interface LayerSource {
  kind: SourceKind;
  // static
  value?: string;
  // user_input
  field?: string;
  // ai_text
  fallback?: string;
  // asset_pack
  pack?: string;
  asset_id?: string;
  // ai_text constraints (informational)
  constraints?: { tone?: string[]; max_chars?: number; language?: string };
}

export interface Rect {
  x: number; y: number; w?: number; h?: number;
}

export interface TextStyle {
  font?: string;
  weight?: number;
  size: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  line_height?: number;
  letter_spacing?: number;
  shadow?: { color?: string };
}

export interface ShapeStyle {
  fill?: string;
  radius?: number;
}

export interface FilterSpec {
  type: 'blur' | 'darken';
  radius?: number;
  amount?: number;
}

export type LayerShape = 'circle' | { kind: 'rounded'; radius: number };

export interface LayerBorder {
  width?: number;
  color?: string;
}

export interface Layer {
  id: string;
  type: LayerType;
  source: LayerSource;
  rect: Rect;
  fit?: 'cover' | 'contain' | 'fill';
  opacity?: number;
  filters?: FilterSpec[];
  style?: TextStyle | ShapeStyle;
  wrap?: boolean;
  optional?: boolean;
  constraints?: { max_chars?: number };
  shape?: LayerShape;
  border?: LayerBorder;
}

export interface CanvasSpec {
  width: number;
  height: number;
  background?: string;
}

export interface TemplateEffects {
  available: string[];
  default: string;
  targets: string[];
}

export interface TemplateSchema {
  id: string;
  name: string;
  version: number;
  canvas: CanvasSpec;
  palette: Record<string, string>;
  fonts?: { family: string; weights?: number[] }[];
  layers: Layer[];
  effects?: TemplateEffects;
}

export interface TemplateSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  version: number;
  thumbnail_url: string | null;
}

export interface TemplateDetail extends TemplateSummary {
  schema: TemplateSchema;
}

export interface AssetPackData {
  id: string;
  slug: string;
  name: string;
  assets: { id: string; kind: string; value: string; tags?: string[] }[];
}
