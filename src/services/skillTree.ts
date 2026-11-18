export interface SkillNode {
  id: string;
  label: string;
  year: number;
  description?: string;
  prerequisites: string[];
}

/** Pre-DVM and Year 1-3 prerequisite chain derived from PSAU and CMO curricula. */
export const SKILL_TREE_NODES: SkillNode[] = [
  // Year 0 (Pre-DVM / foundational)
  {
    id: 'gen-bio',
    label: 'General Biology',
    year: 0,
    description: 'Cell biology, genetics basics, taxonomy',
    prerequisites: [],
  },
  {
    id: 'gen-chem',
    label: 'General/Inorganic Chemistry',
    year: 0,
    description: 'Atomic structure, bonding, stoichiometry',
    prerequisites: [],
  },
  {
    id: 'statistics',
    label: 'Biostatistics',
    year: 0,
    description: 'Descriptive & inferential statistics, hypothesis testing',
    prerequisites: [],
  },
  {
    id: 'org-chem',
    label: 'Organic Chemistry',
    year: 0,
    description: 'Functional groups, reaction mechanisms',
    prerequisites: ['gen-chem'],
  },
  {
    id: 'genetics',
    label: 'Genetics & Molecular Bio',
    year: 0,
    description: 'Mendelian genetics, DNA, molecular techniques',
    prerequisites: ['gen-bio'],
  },
  {
    id: 'biochem',
    label: 'Biochemistry',
    year: 1,
    description: 'Metabolism, enzymes, molecular pathways',
    prerequisites: ['org-chem', 'gen-bio'],
  },
  {
    id: 'anim-prod',
    label: 'Animal Production & Economics',
    year: 1,
    description: 'Livestock systems, economics',
    prerequisites: ['gen-bio'],
  },
  {
    id: 'nutrition',
    label: 'Animal Nutrition',
    year: 1,
    description: 'Nutrients, feed composition, ration formulation',
    prerequisites: ['biochem'],
  },
  {
    id: 'breeding',
    label: 'Animal Breeding & Genetics',
    year: 1,
    description: 'Quantitative genetics, selection, breeding systems',
    prerequisites: ['genetics'],
  },
  // Year 2
  {
    id: 'embryology',
    label: 'Embryology',
    year: 2,
    description: 'Developmental stages, teratology',
    prerequisites: ['gen-bio', 'genetics'],
  },
  {
    id: 'gross-anat',
    label: 'Gross Anatomy',
    year: 2,
    description: 'Osteology, myology, splanchnology, neurology, angiology',
    prerequisites: ['gen-bio'],
  },
  {
    id: 'histology',
    label: 'Histology',
    year: 2,
    description: 'Microanatomy of tissues and organs',
    prerequisites: ['gen-bio', 'biochem'],
  },
  // Year 3
  {
    id: 'gen-physiol',
    label: 'General Physiology',
    year: 3,
    description: 'Cell physiology, nerve/muscle, cardiovascular, respiratory',
    prerequisites: ['biochem', 'histology', 'gross-anat'],
  },
  {
    id: 'gen-micro',
    label: 'General Microbiology',
    year: 3,
    description: 'Bacteriology, virology, mycology basics',
    prerequisites: ['biochem'],
  },
  {
    id: 'gen-path',
    label: 'General Pathology',
    year: 3,
    description: 'Cell injury, inflammation, neoplasia',
    prerequisites: ['histology', 'gen-physiol'],
  },
  {
    id: 'basic-pharm',
    label: 'Basic Pharmacology',
    year: 3,
    description: 'Pharmacokinetics, pharmacodynamics, drug classes',
    prerequisites: ['gen-physiol', 'biochem'],
  },
  // Year 4
  {
    id: 'sys-physiol',
    label: 'Systemic Physiology',
    year: 4,
    description: 'GI, renal, endocrine, reproductive physiology',
    prerequisites: ['gen-physiol'],
  },
  {
    id: 'bact-myco',
    label: 'Bacteriology & Mycology',
    year: 4,
    description: 'Specific pathogens, culture techniques, antimicrobials',
    prerequisites: ['gen-micro', 'basic-pharm'],
  },
  {
    id: 'entom-proto',
    label: 'Entomology & Protozoology',
    year: 4,
    description: 'Arthropods, protozoa, life cycles',
    prerequisites: ['gen-bio'],
  },
  {
    id: 'clin-pharm',
    label: 'Clinical Pharmacology',
    year: 4,
    description: 'Formulary, drug dosing, withdrawal periods',
    prerequisites: ['basic-pharm', 'gen-physiol'],
  },
  {
    id: 'sys-path',
    label: 'Systemic Pathology',
    year: 4,
    description: 'Organ-specific lesions, pathogenesis, diagnosis',
    prerequisites: ['gen-path'],
  },
  {
    id: 'repro-physiol',
    label: 'Reproductive Physiology & Endocrinology',
    year: 4,
    description: 'Hormonal cycles, pregnancy, parturition',
    prerequisites: ['sys-physiol'],
  },
];

export function getPrerequisites(nodeId: string): SkillNode[] {
  const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
  if (!node) return [];
  return node.prerequisites
    .map((id) => SKILL_TREE_NODES.find((n) => n.id === id))
    .filter((n): n is SkillNode => !!n);
}

export function getDependents(nodeId: string): SkillNode[] {
  return SKILL_TREE_NODES.filter((n) => n.prerequisites.includes(nodeId));
}

export function getNodesByYear(year: number): SkillNode[] {
  return SKILL_TREE_NODES.filter((n) => n.year === year);
}
