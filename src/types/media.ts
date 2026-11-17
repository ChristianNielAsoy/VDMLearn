export type MediaKind = 'diagram' | 'micrograph' | 'radiograph' | 'photo' | 'chart';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  /** Relative path under /public/media/ or a URL */
  path: string;
  title: string;
  attribution: string;
  license: string;
  source: string;
  species?: string;
  competencyId?: string;
  verified: boolean;
  addedAt: number;
}

export interface StepperStep {
  id: string;
  title: string;
  body: string;
  /** Optional Mermaid diagram code for this step */
  diagram?: string;
}

export interface StepperDef {
  id: string;
  title: string;
  competencyId?: string;
  description: string;
  source: string;
  steps: StepperStep[];
}
