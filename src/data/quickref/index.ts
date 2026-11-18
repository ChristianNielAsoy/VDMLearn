export interface QuickRefRow {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}

export interface QuickRefCard {
  id: string;
  title: string;
  source: string;
  verified: boolean;
  rows: QuickRefRow[];
}

export const QUICK_REF_CARDS: QuickRefCard[] = [
  {
    id: 'vitals-dog',
    title: 'Normal Vital Signs — Dog',
    source: 'Nelson RW, Couto CG. Small Animal Internal Medicine, 6th ed. (Elsevier, 2019)',
    verified: true,
    rows: [
      { label: 'Body temperature', value: '38.3–39.2', unit: '°C' },
      {
        label: 'Heart rate (adult)',
        value: '60–140',
        unit: 'bpm',
        note: 'Up to 180 bpm in toy breeds',
      },
      { label: 'Respiratory rate', value: '10–30', unit: 'rpm' },
      { label: 'CRT', value: '< 2', unit: 's' },
      { label: 'Systolic BP', value: '100–160', unit: 'mmHg' },
    ],
  },
  {
    id: 'vitals-cat',
    title: 'Normal Vital Signs — Cat',
    source: 'Nelson RW, Couto CG. Small Animal Internal Medicine, 6th ed. (Elsevier, 2019)',
    verified: true,
    rows: [
      { label: 'Body temperature', value: '38.0–39.3', unit: '°C' },
      { label: 'Heart rate', value: '140–220', unit: 'bpm' },
      { label: 'Respiratory rate', value: '15–30', unit: 'rpm' },
      { label: 'CRT', value: '< 2', unit: 's' },
      { label: 'Systolic BP', value: '120–170', unit: 'mmHg' },
    ],
  },
  {
    id: 'vitals-bovine',
    title: 'Normal Vital Signs — Cattle',
    source: 'Rebhun WC. Diseases of Dairy Cattle, 2nd ed. (Wiley, 1995); Merck Veterinary Manual',
    verified: true,
    rows: [
      { label: 'Body temperature', value: '38.0–39.5', unit: '°C' },
      { label: 'Heart rate', value: '48–84', unit: 'bpm' },
      { label: 'Respiratory rate', value: '12–36', unit: 'rpm' },
      { label: 'Rumen motility', value: '1–2', unit: 'contractions/2 min' },
    ],
  },
  {
    id: 'vitals-swine',
    title: 'Normal Vital Signs — Swine',
    source:
      'Zimmerman JJ et al. Diseases of Swine, 11th ed. (Wiley, 2019); Merck Veterinary Manual',
    verified: true,
    rows: [
      { label: 'Body temperature', value: '38.7–39.8', unit: '°C' },
      { label: 'Heart rate', value: '55–86', unit: 'bpm' },
      { label: 'Respiratory rate', value: '8–18', unit: 'rpm' },
    ],
  },
  {
    id: 'gestation-periods',
    title: 'Gestation Periods',
    source:
      'McDonald LE, Pineda MH. Veterinary Endocrinology and Reproduction, 4th ed. (Lea & Febiger, 1989); Merck Veterinary Manual',
    verified: true,
    rows: [
      { label: 'Dog (bitch)', value: '58–65', unit: 'days', note: 'Avg 63 days from LH surge' },
      { label: 'Cat (queen)', value: '58–70', unit: 'days', note: 'Avg 65 days' },
      {
        label: 'Cattle (cow)',
        value: '279–292',
        unit: 'days',
        note: 'Avg 283 days; varies by breed',
      },
      { label: 'Horse (mare)', value: '320–362', unit: 'days', note: 'Avg 340 days' },
      {
        label: 'Swine (sow)',
        value: '112–115',
        unit: 'days',
        note: '"3 months, 3 weeks, 3 days" mnemonic ≈ 114',
      },
      { label: 'Sheep (ewe)', value: '144–152', unit: 'days', note: 'Avg 147 days' },
      { label: 'Goat (doe)', value: '145–155', unit: 'days', note: 'Avg 150 days' },
      { label: 'Rabbit (doe)', value: '28–34', unit: 'days', note: 'Avg 31 days' },
    ],
  },
  {
    id: 'estrous-cycles',
    title: 'Estrous Cycle Data',
    source:
      'McDonald LE, Pineda MH. Veterinary Endocrinology and Reproduction, 4th ed. (Lea & Febiger, 1989)',
    verified: true,
    rows: [
      {
        label: 'Dog — cycle length',
        value: '5–10 months',
        unit: '',
        note: 'Monoestrous or diestrous',
      },
      { label: 'Dog — estrus duration', value: '5–9 days', unit: '' },
      {
        label: 'Cat — cycle length',
        value: '14–21 days',
        unit: '',
        note: 'Seasonally polyestrous; induced ovulator',
      },
      { label: 'Cow — cycle length', value: '21 days', unit: '', note: 'Range 18–24' },
      { label: 'Cow — estrus duration', value: '6–24 h', unit: '' },
      {
        label: 'Mare — cycle length',
        value: '21–22 days',
        unit: '',
        note: 'Seasonally polyestrous',
      },
      { label: 'Mare — estrus duration', value: '5–7 days', unit: '' },
      { label: 'Sow — cycle length', value: '21 days', unit: '', note: 'Range 18–24' },
      {
        label: 'Ewe — cycle length',
        value: '17 days',
        unit: '',
        note: 'Range 14–19; short-day breeder',
      },
    ],
  },
  {
    id: 'cbc-dog-normal',
    title: 'Normal CBC Reference Ranges — Dog',
    source:
      'Stockham SL, Scott MA. Fundamentals of Veterinary Clinical Pathology, 2nd ed. (Blackwell, 2008)',
    verified: true,
    rows: [
      { label: 'RBC', value: '5.5–8.5', unit: '×10⁶/μL' },
      { label: 'Hgb', value: '12–18', unit: 'g/dL' },
      { label: 'PCV/HCT', value: '37–55', unit: '%' },
      { label: 'WBC', value: '6–17', unit: '×10³/μL' },
      { label: 'Neutrophils', value: '3–11.5', unit: '×10³/μL' },
      { label: 'Lymphocytes', value: '1–4.8', unit: '×10³/μL' },
      { label: 'Platelets', value: '200–500', unit: '×10³/μL' },
    ],
  },
  {
    id: 'body-condition-score',
    title: 'Body Condition Score Reference',
    source:
      'Laflamme DP. Development and validation of a body condition score system for dogs. Canine Pract. 1997;22:10–15.',
    verified: true,
    rows: [
      {
        label: 'BCS 1',
        value: 'Emaciated',
        unit: '',
        note: 'Ribs, spine, pelvis all visible from distance; no palpable fat',
      },
      {
        label: 'BCS 3',
        value: 'Thin',
        unit: '',
        note: 'Ribs easily palpable; waist visible; minimal abdominal fat',
      },
      {
        label: 'BCS 5',
        value: 'Ideal',
        unit: '',
        note: 'Ribs palpable without excess fat; waist behind ribs; minimal abdominal tuck',
      },
      {
        label: 'BCS 7',
        value: 'Overweight',
        unit: '',
        note: 'Ribs palpable with difficulty; heavy fat deposit; waist barely visible',
      },
      {
        label: 'BCS 9',
        value: 'Obese',
        unit: '',
        note: 'Ribs not palpable; heavy fat deposits; obvious abdominal distension',
      },
    ],
  },
];

export function getQuickRefCard(id: string): QuickRefCard | undefined {
  return QUICK_REF_CARDS.find((c) => c.id === id);
}
