import type { StepperDef } from '@/types/media';

export const STEPPERS: StepperDef[] = [
  {
    id: 'toxoplasma-life-cycle',
    title: 'Toxoplasma gondii Life Cycle',
    competencyId: 'Veterinary Parasitology:B.4',
    description: 'Two-host life cycle of Toxoplasma gondii (Apicomplexa: Sarcocystidae).',
    source:
      'Urquhart GM et al. Veterinary Parasitology, 2nd ed. (Blackwell, 1996), Ch. 3; Merck Veterinary Manual.',
    steps: [
      {
        id: 'tx1',
        title: 'Definitive host: cat ingests infected tissue',
        body: 'Felids (domestic and wild cats) are the definitive hosts. Cats become infected by ingesting tissue cysts (bradyzoites) from an intermediate host (e.g., rodent, bird) or oocysts from soil.',
        diagram: `flowchart LR
  A[Cat ingests tissue cysts\nor oocysts] --> B[Small intestine:\nEnteroepithelial stages]`,
      },
      {
        id: 'tx2',
        title: 'Enteroepithelial cycle in cat',
        body: "In the cat's small intestine enterocytes, the parasite undergoes several asexual generations (tachyzoite-like forms), followed by gametogony — macrogametocytes and microgametocytes form.",
        diagram: `flowchart LR
  B[Enteroepithelial stages] --> C[Macrogametes + Microgametes] --> D[Zygote → Oocyst]`,
      },
      {
        id: 'tx3',
        title: 'Oocyst shedding',
        body: 'Unsporulated oocysts are shed in cat feces beginning ~3–10 days post-infection (PI) and continuing for 1–3 weeks. Each cat typically sheds oocysts only once in its lifetime unless immunosuppressed.',
        diagram: `flowchart LR
  D[Oocyst passed in feces] --> E[Sporulates in environment\nin 1–5 days at 24°C]`,
      },
      {
        id: 'tx4',
        title: 'Sporulation and environmental survival',
        body: 'Outside the host, oocysts sporulate within 1–5 days (temperature-dependent). Sporulated oocysts contain 2 sporocysts each with 4 sporozoites. They can survive in moist soil for months to years.',
      },
      {
        id: 'tx5',
        title: 'Intermediate host ingestion',
        body: 'Warm-blooded animals (all mammals including humans, plus birds) are intermediate hosts. They ingest sporulated oocysts from contaminated soil, water, or vegetation.',
      },
      {
        id: 'tx6',
        title: 'Tachyzoite phase (acute)',
        body: 'Sporozoites penetrate the gut epithelium, transform into tachyzoites, and rapidly disseminate via blood and lymph to any nucleated cell. This is the acute stage responsible for clinical signs in immunocompromised hosts.',
        diagram: `flowchart LR
  F[Sporozoites → Tachyzoites] --> G[Rapid intracellular\nmultiplication] --> H[Cell rupture → new cells]`,
      },
      {
        id: 'tx7',
        title: 'Bradyzoite / tissue cyst phase (chronic)',
        body: 'As the immune response develops, tachyzoites convert to bradyzoites and form tissue cysts. These persist lifelong in brain, muscle, and retina. Tissue cysts are the source of infection for predator–prey transmission.',
        diagram: `flowchart LR
  H[Immune pressure] --> I[Tachyzoites → Bradyzoites\nin tissue cysts] --> J[Brain, muscle, retina\nlifelong persistence]`,
      },
      {
        id: 'tx8',
        title: 'Transmission routes summary',
        body: '1. Carnivory: predator eats infected prey tissue cysts (most efficient for cats). 2. Oocyst ingestion: from soil/water/unwashed produce. 3. Transplacental (congenital): tachyzoites cross the placenta during primary infection in pregnancy (sheep: abortion; humans: congenital toxoplasmosis).',
        diagram: `flowchart TD
  OO[Oocyst ingestion\nsoil/water] --> IMH[Intermediate host]
  TC[Tissue cyst ingestion\ncarnivory] --> IMH
  IMH -->|Tachyzoite in pregnancy| PL[Transplacental → fetus]
  IMH -->|Tissue cysts in prey| CAT[Definitive host: cat]`,
      },
    ],
  },
  {
    id: 'dirofilaria-life-cycle',
    title: 'Dirofilaria immitis Life Cycle (Heartworm)',
    competencyId: 'Veterinary Parasitology:A.3',
    description:
      'Life cycle of Dirofilaria immitis (Nematoda: Onchocercidae), the canine and feline heartworm.',
    source: "Bowman DD. Georgis' Parasitology for Veterinarians, 11th ed. (Elsevier, 2021), Ch. 8.",
    steps: [
      {
        id: 'di1',
        title: 'Microfilariae in blood of definitive host',
        body: 'Adult male and female worms live in the pulmonary artery and right heart of dogs (and rarely cats, ferrets, wild canids). Females release first-stage larvae (L1 = microfilariae) into the bloodstream. Microfilariae are unsheathed and 220–325 μm long.',
      },
      {
        id: 'di2',
        title: 'Mosquito takes blood meal (L1 ingestion)',
        body: 'An Aedes, Culex, or Anopheles mosquito ingests microfilariae (L1) during a blood meal. Over 70 mosquito species can serve as intermediate hosts.',
      },
      {
        id: 'di3',
        title: 'Development in mosquito (L1 → L3)',
        body: 'Inside the mosquito Malpighian tubules, microfilariae undergo two molts: L1 → L2 (sausage stage) → L3 (infective stage). Development takes ~10–14 days at 27°C. Cold temperatures abort development; transmission requires sustained warmth.',
        diagram: `flowchart LR
  L1[L1 microfilaria] --> L2[L2 sausage stage\nMalpighian tubules] --> L3[L3 infective larvae\nhead/proboscis]`,
      },
      {
        id: 'di4',
        title: 'L3 deposited on skin during bite',
        body: 'L3 migrate to the mosquito head and mouthparts. When the mosquito feeds, L3 are deposited on the host skin and enter through the bite wound.',
      },
      {
        id: 'di5',
        title: 'Migration in definitive host (L3 → L5)',
        body: 'L3 → L4 molt in subcutaneous tissue (~9 days PI). L4 → L5 (young adult) molt in subcutaneous/abdominal tissues (~60–70 days PI). Young adults then migrate via venous circulation to the pulmonary artery.',
        diagram: `flowchart LR
  L3[L3 on skin] --> SC[Subcutaneous\ntissue L3→L4] --> L4L5[L4→L5 molt\n~60 days PI] --> PA[Pulmonary artery\n~70–120 days PI]`,
      },
      {
        id: 'di6',
        title: 'Adult worm maturation',
        body: 'Adults mature and mate in the right heart and pulmonary arteries. Patent infection (circulating microfilariae) develops ~6–7 months PI in dogs. Adults live 5–7 years in dogs; patency in cats is rare due to immune clearance.',
      },
      {
        id: 'di7',
        title: 'Clinical disease',
        body: 'Adult worms cause endarteritis, pulmonary hypertension, right-sided CHF, and "caval syndrome" (massive worm burden obstructing tricuspid valve). Microfilariae cause type III hypersensitivity in cats ("occult heartworm"). Prevention: monthly macrocyclic lactone (ivermectin, milbemycin, selamectin).',
      },
    ],
  },
  {
    id: 'fmd-pathogenesis',
    title: 'Foot-and-Mouth Disease (FMD) Pathogenesis',
    competencyId: 'Veterinary Microbiology and Public Health:D.2',
    description:
      'Pathogenesis of Foot-and-Mouth Disease Virus (FMDV, Aphthovirus) in cloven-hoofed animals.',
    source:
      'Fenner FJ et al. Veterinary Virology, 2nd ed. (Academic Press, 1993); OIE Technical Disease Card.',
    steps: [
      {
        id: 'fmd1',
        title: 'Entry via respiratory mucosa',
        body: 'FMDV primarily enters via the respiratory mucosa (oropharynx), where it replicates in the pharyngeal epithelium. Aerosol transmission from exhalation of infected animals is the most common natural route. Minimum infective dose is very low (10 TCID₅₀ by aerosol).',
      },
      {
        id: 'fmd2',
        title: 'Primary viraemia',
        body: 'Virus disseminates from the pharyngeal site to regional lymph nodes, then enters the bloodstream (primary viraemia, 1–2 days PI). The virus is lymphotropic and spreads to susceptible epithelial tissues.',
      },
      {
        id: 'fmd3',
        title: 'Vesicle formation (primary lesions)',
        body: 'Virus replicates in stratum spinosum of stratified squamous epithelium. Keratinocyte lysis causes intracellular edema → primary vesicles on the tongue, dental pad, coronary band, and interdigital skin. Lesions in the mouth cause drooling (ptyalism).',
        diagram: `flowchart LR
  V[Virus infects\nepithelial cells] --> LY[Lysis of keratinocytes] --> VES[Vesicle formation:\ntongue, feet, teats]`,
      },
      {
        id: 'fmd4',
        title: 'Secondary viraemia and vesicle spread',
        body: 'Vesicle fluid (10⁷–10⁹ viral particles/mL) is a major source of contagion. Lesions on the feet cause severe lameness. Teat lesions impair milking. Secondary lesions spread to the rumen pillars, heart (tiger heart in young animals = myocarditis), and skeletal muscle.',
      },
      {
        id: 'fmd5',
        title: 'Resolution and carrier state',
        body: 'Most adult cattle recover in 2–3 weeks. Approximately 50% of recovered cattle become pharyngeal carriers for up to 2–3 years (cattle, buffalo). Pigs and sheep rarely become carriers. Persistent infection occurs in the dorsal soft palate. Carriers are an ongoing reservoir risk.',
      },
    ],
  },
];

export function getStepper(id: string): StepperDef | undefined {
  return STEPPERS.find((s) => s.id === id);
}
