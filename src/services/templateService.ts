import { http } from './http';
import type { TemplateSummary, TemplateDetail, AssetPackData } from '../domain/template.types';

export const templateService = {
  list(category?: string): Promise<{ count: number; results: TemplateSummary[] }> {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return http(`/templates/${q}`);
  },
  detail(slug: string): Promise<TemplateDetail> {
    return http(`/templates/${slug}/`);
  },
  assetPacks(): Promise<{ count: number; results: AssetPackData[] }> {
    return http('/asset-packs/');
  },
};
