export interface OcclusionRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OcclusionCard {
  id: string;
  title: string;
  competencyId?: string;
  /** Inline SVG (own drawing) or relative path under /public/media/ */
  svgContent: string;
  viewBox: string;
  source: string;
  regions: OcclusionRegion[];
}
