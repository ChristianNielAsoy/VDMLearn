export type ResourceType = 'atlas' | 'reference' | 'video' | 'course' | 'article';

export interface ResourceEntry {
  id?: number;
  competencyId: string;
  url: string;
  sourceName: string;
  licenseNote: string;
  verifiedBy?: string;
  type: ResourceType;
  addedAt: number;
}
