export interface HotspotRegion {
  id: string;
  label: string;
  /** SVG center coordinates (relative to viewBox) */
  cx: number;
  cy: number;
  /** Optional longer description shown in atlas mode */
  description?: string;
}

export interface HotspotDiagram {
  id: string;
  title: string;
  competencyId?: string;
  description: string;
  source: string;
  /** Inline SVG string (own drawing, no external images) */
  svgContent: string;
  /** ViewBox dimensions matching the SVG */
  viewBox: string;
  regions: HotspotRegion[];
}
