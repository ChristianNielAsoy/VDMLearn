import type { CaseDef } from '@/types/case';

/**
 * All cases are original educational scenarios.
 * No board exam items are reproduced. Sources are cited per node.
 */
export const CASES: CaseDef[] = [
  // ── Case 1: Canine Infectious Tracheobronchitis (Kennel Cough) ──────────────
  {
    id: 'canine-kennel-cough',
    title: 'The Coughing Puppy',
    species: 'Canine',
    description:
      'A recently adopted puppy presents with a persistent cough. Work through the history, examination, and diagnostics to reach a diagnosis and treatment plan.',
    competencyIds: [
      'Veterinary Microbiology and Public Health:B.1',
      'Veterinary Medicine:A.2',
    ],
    source:
      'Original case. Cf. Greene CE. Infectious Diseases of the Dog and Cat, 4th ed. (Elsevier, 2012), Ch. 6; Merck Veterinary Manual — Infectious Tracheobronchitis.',
    verified: true,
    startNodeId: 'kc-s1',
    maxScore: 20,
    nodes: [
      {
        id: 'kc-s1',
        kind: 'signalment',
        title: 'Signalment',
        content:
          'Species: Canine\nBreed: Labrador Retriever mix\nAge: 4 months\nSex: Male, intact\nWeight: 8.2 kg\n\nOwner reports adopted from an animal shelter 10 days ago.',
        next: 'kc-h1',
      },
      {
        id: 'kc-h1',
        kind: 'history',
        title: 'History',
        content:
          'Chief complaint: Harsh, dry cough for 5 days. Described by owner as "honking."\n\nAnamnesis:\n• Cough is worse with excitement or exercise\n• Occasional gagging at the end of a coughing episode\n• Mild serous nasal discharge\n• Eating and drinking normally\n• Vaccination history unknown (shelter records incomplete)\n• No other pets in household',
        next: 'kc-e1',
      },
      {
        id: 'kc-e1',
        kind: 'exam',
        title: 'Physical Examination',
        content:
          'General: Bright, alert, responsive. Mild excitement-related coughing during exam.\n\nVital signs:\n• Temperature: 38.9 °C (normal 38.3–39.2 °C)\n• Heart rate: 112 bpm\n• Respiratory rate: 24 brpm, no dyspnea at rest\n\nFindings:\n• Tracheal sensitivity on palpation (positive tracheal pinch test)\n• Mild serous nasal discharge\n• Lung sounds: clear bilaterally, no crackles or wheezes\n• Submandibular lymph nodes: mildly enlarged, soft\n• All other systems: within normal limits',
        next: 'kc-d1',
        competencyIds: ['Veterinary Medicine:A.2'],
      },
      {
        id: 'kc-d1',
        kind: 'decision',
        title: 'Diagnostic Approach',
        content:
          'Based on the signalment, history, and physical examination, what is the most appropriate next step?',
        choices: [
          {
            id: 'kc-d1-a',
            label: 'PCR respiratory panel (Bordetella bronchiseptica, canine parainfluenza virus, canine adenovirus-2)',
            next: 'kc-l1',
            correct: true,
            points: 10,
            feedback:
              'Correct. A PCR respiratory panel is the gold standard for identifying pathogens in infectious tracheobronchitis. It differentiates Bordetella from viral causes and guides targeted therapy.',
          },
          {
            id: 'kc-d1-b',
            label: 'Complete blood count and serum chemistry only',
            next: 'kc-l1b',
            correct: false,
            points: 2,
            feedback:
              'CBC/chemistry may be performed but rarely changes management in straightforward kennel cough. It does not identify the causative organism. A respiratory PCR panel is more informative.',
          },
          {
            id: 'kc-d1-c',
            label: 'Start empiric doxycycline immediately without diagnostics',
            next: 'kc-d2-skip',
            correct: false,
            points: 0,
            feedback:
              'Empiric antibiotics are sometimes used in clinical practice but are not ideal in a 4-month-old puppy without confirming bacterial involvement. This approach also does not distinguish viral (self-limiting) from bacterial disease.',
          },
        ],
        competencyIds: ['Veterinary Microbiology and Public Health:B.1'],
      },
      {
        id: 'kc-l1',
        kind: 'labs',
        title: 'Diagnostic Results',
        content:
          'PCR Respiratory Panel (nasopharyngeal swab):\n• Bordetella bronchiseptica: POSITIVE\n• Canine parainfluenza virus: Negative\n• Canine adenovirus-2: Negative\n• Mycoplasma cynos: Negative\n\nCBC (performed alongside): Mild neutrophilia (13.2 × 10⁹/L); all other parameters within normal limits.\n\nDiagnosis: Bordetella bronchiseptica tracheobronchitis (Kennel Cough).',
        next: 'kc-d2',
      },
      {
        id: 'kc-l1b',
        kind: 'labs',
        title: 'Lab Results',
        content:
          'CBC: Mild neutrophilia (13.2 × 10⁹/L). Serum chemistry: within normal limits.\n\nNote: These results are consistent with a mild bacterial infection but are non-specific. Without a respiratory PCR, the causative pathogen is unknown.\n\nThe clinician proceeds to add a PCR respiratory panel.',
        next: 'kc-d2',
      },
      {
        id: 'kc-d2-skip',
        kind: 'decision',
        title: 'Treatment Plan (empiric)',
        content:
          'Without confirmed diagnostics, what empiric antibiotic regimen is most appropriate for suspected Bordetella tracheobronchitis in this 4-month-old puppy?',
        choices: [
          {
            id: 'kc-d2s-a',
            label: 'Doxycycline 5 mg/kg PO q12h × 10 days + rest + cough suppressant as needed',
            next: 'kc-o1',
            correct: true,
            points: 10,
            feedback:
              'Correct. Doxycycline is the drug of choice for Bordetella infections. Rest reduces coughing triggers. Cough suppressants (butorphanol, hydrocodone) may be used in non-productive cases but should not suppress productive cough.',
          },
          {
            id: 'kc-d2s-b',
            label: 'Amoxicillin-clavulanate 12.5 mg/kg PO q12h × 7 days',
            next: 'kc-o1b',
            correct: false,
            points: 2,
            feedback:
              'Amoxicillin-clavulanate has some activity against Bordetella but doxycycline or fluoroquinolones are preferred. Resistance to beta-lactams is common in Bordetella.',
          },
          {
            id: 'kc-d2s-c',
            label: 'No antibiotics; supportive care only (rest, humidified air)',
            next: 'kc-o1c',
            correct: false,
            points: 0,
            feedback:
              'In healthy adult dogs, kennel cough is often self-limiting. However, in young puppies (< 6 months) or shelter dogs with unknown vaccination history, antibiotic treatment of confirmed or suspected Bordetella is recommended to prevent progression to pneumonia.',
          },
        ],
      },
      {
        id: 'kc-d2',
        kind: 'decision',
        title: 'Treatment Plan',
        content:
          'PCR confirms Bordetella bronchiseptica. The puppy is otherwise healthy. What is the most appropriate treatment?',
        choices: [
          {
            id: 'kc-d2-a',
            label: 'Doxycycline 5 mg/kg PO q12h × 10 days + rest + cough suppressant as needed',
            next: 'kc-o1',
            correct: true,
            points: 10,
            feedback:
              'Correct. Doxycycline is first-line for Bordetella bronchiseptica. A 10-day course covers the bacterial shedding period. Rest and minimizing excitement reduce coughing episodes. Cough suppressants are optional for non-productive cough.',
          },
          {
            id: 'kc-d2-b',
            label: 'Amoxicillin-clavulanate 12.5 mg/kg PO q12h × 7 days',
            next: 'kc-o1b',
            correct: false,
            points: 2,
            feedback:
              'Beta-lactams (including amoxicillin-clavulanate) have limited efficacy against Bordetella due to intrinsic and acquired resistance. Doxycycline or fluoroquinolones are preferred.',
          },
          {
            id: 'kc-d2-c',
            label: 'Supportive care only; Bordetella is self-limiting',
            next: 'kc-o1c',
            correct: false,
            points: 0,
            feedback:
              'Self-limiting in healthy adults, but in an unvaccinated 4-month-old puppy, antibiotic treatment is indicated to prevent progression to Bordetella bronchopneumonia, which carries a guarded prognosis.',
          },
        ],
        competencyIds: ['Veterinary Microbiology and Public Health:B.1', 'Veterinary Medicine:A.2'],
      },
      {
        id: 'kc-o1',
        kind: 'outcome',
        title: 'Outcome — Excellent',
        content:
          'The puppy completed a 10-day course of doxycycline. Cough resolved by day 7.\n\nOwner was advised to:\n• Keep the puppy away from other dogs for 2 weeks (to prevent spread)\n• Complete core vaccinations (including intranasal Bordetella vaccine)\n• Return if cough worsens, dyspnea develops, or fever persists\n\nFull recovery. Vaccinations scheduled.',
        finalDiagnosis: 'Bordetella bronchiseptica tracheobronchitis (Kennel Cough)',
      },
      {
        id: 'kc-o1b',
        kind: 'outcome',
        title: 'Outcome — Partial Response',
        content:
          'The puppy showed partial improvement on amoxicillin-clavulanate but still had a mild cough at day 7 recheck. Culture and sensitivity results (from the PCR swab) confirmed Bordetella with intermediate susceptibility to amoxicillin.\n\nTreatment was switched to doxycycline 5 mg/kg PO q12h × 7 more days. Full resolution occurred by day 14.\n\nLesson: First-line treatment for Bordetella is doxycycline or a fluoroquinolone.',
        finalDiagnosis: 'Bordetella bronchiseptica tracheobronchitis — partial response to beta-lactam; resolved with doxycycline',
      },
      {
        id: 'kc-o1c',
        kind: 'outcome',
        title: 'Outcome — Complication',
        content:
          'Without antibiotic treatment, the puppy\'s condition worsened over the next 5 days. At recheck:\n• Temperature: 40.1 °C\n• Respiratory rate: 38 brpm with mild effort\n• Crackles in cranioventral lung fields\n• Radiographs: alveolar pattern cranioventral lobes\n\nDiagnosis: Bordetella bronchopneumonia (progression due to untreated bacterial infection).\n\nThe puppy required hospitalization, IV doxycycline, and supportive care. Recovered over 7 days with intensive treatment.\n\nLesson: Young, unvaccinated puppies with Bordetella require antibiotic treatment — the disease is not reliably self-limiting in this population.',
        finalDiagnosis: 'Bordetella bronchopneumonia (complication of untreated tracheobronchitis)',
      },
    ],
  },

  // ── Case 2: Periparturient Hypocalcemia (Milk Fever) in Dairy Cattle ────────
  {
    id: 'bovine-milk-fever',
    title: 'The Down Dairy Cow',
    species: 'Bovine',
    description:
      'A mature Holstein cow is found unable to rise 24 hours after calving. Work through the examination, diagnosis, and appropriate treatment for a common periparturient emergency.',
    competencyIds: [
      'Veterinary Medicine:D.3',
      'Veterinary Physiology:B.2',
      'Veterinary Surgery:A.2',
    ],
    source:
      'Original case. Cf. Smith BP. Large Animal Internal Medicine, 5th ed. (Elsevier, 2015), Ch. 31; Merck Veterinary Manual — Hypocalcemia in Production Animals.',
    verified: true,
    startNodeId: 'mf-s1',
    maxScore: 20,
    nodes: [
      {
        id: 'mf-s1',
        kind: 'signalment',
        title: 'Signalment',
        content:
          'Species: Bovine (dairy)\nBreed: Holstein-Friesian\nAge: 6 years\nParity: 4th lactation\nWeight: ~620 kg\n\nCalved approximately 24 hours ago. Normal delivery, single healthy calf.',
        next: 'mf-h1',
      },
      {
        id: 'mf-h1',
        kind: 'history',
        title: 'History',
        content:
          'Chief complaint: Recumbent, unable to rise since this morning.\n\nAnamnesis:\n• Cow was standing and eating 12 hours post-calving\n• Found in sternal recumbency this morning; several attempts to rise failed\n• Progressively weaker; now lateral recumbency\n• Minimal interest in feed or water\n• Rumen appears quiet on auscultation per herdsman\n• Previous lactation: no recorded periparturient issues\n• No trauma reported; calving was unassisted',
        next: 'mf-e1',
      },
      {
        id: 'mf-e1',
        kind: 'exam',
        title: 'Physical Examination',
        content:
          'General: Dull, laterally recumbent, minimal voluntary movement.\n\nVital signs:\n• Temperature: 37.1 °C (mildly subnormal; normal 38.5–39.5 °C)\n• Heart rate: 56 bpm (bradycardia; normal 48–80 bpm)\n• Respiratory rate: 20 brpm\n\nFindings:\n• Extremities cool to the touch; mild peripheral vasoconstriction\n• Pupils mildly dilated; menace response sluggish\n• Rumen: hypomotile (1 contraction per 3 min; normal ≥1/2 min)\n• GI: minimal borborygmi; mild bloat\n• Muscle weakness: flaccid; cow cannot maintain sternal recumbency\n• No external evidence of trauma or fracture\n• Udder: appears normal, early milk letdown',
        next: 'mf-d1',
        competencyIds: ['Veterinary Medicine:D.3'],
      },
      {
        id: 'mf-d1',
        kind: 'decision',
        title: 'Initial Assessment and Sampling',
        content:
          'Based on the signalment, history, and physical findings, what is your immediate priority?',
        choices: [
          {
            id: 'mf-d1-a',
            label: 'Collect blood for ionized calcium, total calcium, phosphorus, and magnesium',
            next: 'mf-l1',
            correct: true,
            points: 10,
            feedback:
              'Correct. Collecting blood to confirm hypocalcemia (and rule out concurrent hypophosphatemia or hypomagnesemia) is the most important first step. This guides treatment selection — hypocalcemia and hypophosphatemia require different supplementation.',
          },
          {
            id: 'mf-d1-b',
            label: 'Begin IV calcium gluconate 23% immediately without sampling',
            next: 'mf-l1b',
            correct: false,
            points: 5,
            feedback:
              'IV calcium is likely the correct treatment, but administering it without confirming the diagnosis risks: (1) missing concurrent hypophosphatemia or hypomagnesemia, (2) potential cardiac toxicity from rapid IV calcium infusion. Blood sampling adds only 5 minutes and dramatically improves case management.',
          },
          {
            id: 'mf-d1-c',
            label: 'Radiograph hindlimbs to rule out fracture before any treatment',
            next: 'mf-l1c',
            correct: false,
            points: 0,
            feedback:
              'Fracture should be on the differential but is less likely given both hindlimbs are equally weak and there is no trauma history. Prioritizing radiographs before stabilization is incorrect — this cow has signs consistent with a metabolic emergency (bradycardia, cool extremities, subnormal temperature) that require prompt treatment.',
          },
        ],
        competencyIds: ['Veterinary Physiology:B.2', 'Veterinary Medicine:D.3'],
      },
      {
        id: 'mf-l1',
        kind: 'labs',
        title: 'Laboratory Results',
        content:
          'Serum electrolytes (jugular sample, rapid in-clinic analyzer):\n• Total calcium: 1.3 mmol/L  (reference: 2.1–2.8 mmol/L)  ← CRITICALLY LOW\n• Ionized calcium: 0.55 mmol/L  (reference: 1.1–1.4 mmol/L)  ← CRITICALLY LOW\n• Phosphorus: 0.6 mmol/L  (reference: 1.3–2.3 mmol/L)  ← LOW\n• Magnesium: 0.72 mmol/L  (reference: 0.74–1.0 mmol/L)  ← low-normal\n• Blood glucose: 3.9 mmol/L  (normal)\n\nConclusion: Severe hypocalcemia with concurrent hypophosphatemia. Consistent with periparturient paresis (milk fever), Stage III.',
        next: 'mf-d2',
      },
      {
        id: 'mf-l1b',
        kind: 'labs',
        title: 'Post-Treatment Assessment',
        content:
          'IV calcium gluconate was administered. Blood drawn immediately after for analysis:\n• Total calcium: 2.0 mmol/L (now near-normal after treatment)\n• Phosphorus: 0.6 mmol/L  ← LOW (not corrected by calcium)\n• Magnesium: 0.73 mmol/L  ← low-normal\n\nNote: The initial hypophosphatemia was missed. Phosphorus supplementation will now need to be added.',
        next: 'mf-d2',
      },
      {
        id: 'mf-l1c',
        kind: 'labs',
        title: 'Radiograph Result',
        content:
          'Radiographs of both hindlimbs: No fractures identified. No evidence of luxation or severe soft-tissue injury.\n\nWhile radiographs were being taken, the cow deteriorated into lateral recumbency and became unresponsive. The delay in metabolic stabilization worsened the prognosis.\n\nBlood calcium (now drawn): Total Ca 1.1 mmol/L — critically low.',
        next: 'mf-d2',
      },
      {
        id: 'mf-d2',
        kind: 'decision',
        title: 'Treatment Selection',
        content:
          'Severe hypocalcemia (Stage III milk fever) confirmed with concurrent hypophosphatemia. The cow is in lateral recumbency with bradycardia. What is the correct treatment?',
        choices: [
          {
            id: 'mf-d2-a',
            label: 'Slow IV calcium gluconate 23% (1 g Ca/45 kg) with cardiac monitoring + subcutaneous calcium + oral calcium boluses when cow is sternal',
            next: 'mf-o1',
            correct: true,
            points: 10,
            feedback:
              'Correct. The standard protocol for Stage III milk fever:\n• IV Ca gluconate 23% (8.6 g/450 mL bottle per 400–500 kg) given slowly over 20–30 minutes with continuous cardiac auscultation; stop if arrhythmia develops\n• SC calcium provides a depot release over 4–6 hours to prevent relapse\n• Oral calcium boluses once the cow is standing (subcutaneous route alone is insufficient for severe cases)\n• Roll cow to sternal recumbency after treatment to prevent bloat and nerve damage',
          },
          {
            id: 'mf-d2-b',
            label: 'Oral calcium bolus alone (calcium propionate bolus orally)',
            next: 'mf-o1b',
            correct: false,
            points: 2,
            feedback:
              'Oral calcium is used for PREVENTION (pre-calving and immediately post-calving in high-risk cows) and for MILD (Stage I) cases. In Stage III milk fever with lateral recumbency and bradycardia, oral calcium absorption is too slow and unreliable — the cow cannot swallow safely and GI motility is impaired. IV calcium is mandatory.',
          },
          {
            id: 'mf-d2-c',
            label: 'High-dose corticosteroids (dexamethasone 20 mg IM) to mobilize calcium',
            next: 'mf-o1c',
            correct: false,
            points: 0,
            feedback:
              'Corticosteroids have no role in acute milk fever treatment. Dexamethasone at high doses in periparturient cows can suppress immune function, impair uterine involution, and risk inducing abortion in pregnant cows. The mechanism of milk fever (failure of parathyroid hormone-driven calcium mobilization in the face of sudden demand) is not corrected by steroids.',
          },
        ],
        competencyIds: ['Veterinary Medicine:D.3', 'Veterinary Surgery:A.2'],
      },
      {
        id: 'mf-o1',
        kind: 'outcome',
        title: 'Outcome — Full Recovery',
        content:
          'IV calcium gluconate (450 mL of 23% solution given over 25 minutes) with cardiac monitoring — no arrhythmias detected.\n\nResponse within 30 minutes:\n• Heart rate returned to 68 bpm\n• Cow became alert and attempted to rise\n• Rumen motility improved\n\nSubcutaneous calcium (2 × 400 mL 23% Ca gluconate) administered at different sites.\n\nCow was assisted to sternal recumbency; stood unassisted 45 minutes post-treatment.\n\nPhosphorus deficiency addressed with IV sodium phosphate (not shown above) + dibasic oral phosphorus supplement for 3 days.\n\nRecheck at 48 hours: standing, eating, milk production normalizing.\n\nKey teaching points:\n• Milk fever peaks at 24–48 hours post-calving in older, high-producing cows\n• Stage III (lateral recumbency, bradycardia) requires IV calcium — do not delay\n• Concurrent hypophosphatemia delays recovery and must be treated\n• Prevention: anionic salts pre-calving, vitamin D3, oral calcium post-calving in at-risk cows',
        finalDiagnosis: 'Periparturient hypocalcemia (Milk Fever), Stage III — full recovery with IV + SC calcium and phosphorus supplementation',
      },
      {
        id: 'mf-o1b',
        kind: 'outcome',
        title: 'Outcome — Treatment Failure',
        content:
          'Oral calcium bolus was administered via balling gun. The cow was unable to maintain sternal recumbency and showed no improvement over 2 hours.\n\nThe cow developed ruminal bloat (dorsal recumbency impairs eructation), and was found with severe bloat and respiratory distress 3 hours later.\n\nEmergency IV calcium was then administered with concurrent trocarization for bloat relief.\n\nOutcome: Prolonged recumbency resulted in compartment syndrome (downer cow syndrome). Despite subsequent IV calcium treatment, the cow never regained normal hindlimb function and was euthanized on day 4.\n\nLesson: Stage III milk fever requires IV calcium. Oral calcium is insufficient and dangerous in a recumbent cow.',
        finalDiagnosis: 'Stage III periparturient hypocalcemia → downer cow syndrome (delayed IV treatment)',
      },
      {
        id: 'mf-o1c',
        kind: 'outcome',
        title: 'Outcome — Incorrect Treatment',
        content:
          'Dexamethasone 20 mg IM was administered. No improvement in calcium levels or clinical signs after 2 hours.\n\nThe cow remained in lateral recumbency. Emergency blood calcium confirmed: 1.1 mmol/L.\n\nIV calcium was eventually administered and the cow recovered, but the 2-hour delay resulted in significant muscle damage (elevated CK, myoglobinuria) and prolonged recovery time (5 days to full standing).\n\nLesson: Corticosteroids have no role in acute hypocalcemia treatment. IV calcium gluconate is the definitive and only appropriate emergency treatment for Stage III milk fever.',
        finalDiagnosis: 'Stage III periparturient hypocalcemia — delayed recovery due to incorrect initial treatment',
      },
    ],
  },
];

export function getCase(id: string): CaseDef | undefined {
  return CASES.find((c) => c.id === id);
}
