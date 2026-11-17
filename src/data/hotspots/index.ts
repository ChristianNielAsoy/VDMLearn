import type { HotspotDiagram } from '@/types/hotspot';

/**
 * All diagrams are original schematic drawings (simple line art).
 * No third-party images are embedded or reproduced.
 */
export const HOTSPOT_DIAGRAMS: HotspotDiagram[] = [
  {
    id: 'heart-chambers',
    title: 'Heart Chambers and Great Vessels (Schematic)',
    competencyId: 'Veterinary Anatomy:D.1',
    description: 'Identify the four chambers and major vessels of the mammalian heart.',
    source: 'Original schematic. Cf. Dyce KM, Sack WO, Wensing CJG. Textbook of Veterinary Anatomy, 4th ed. (Saunders, 2010), Ch. 7.',
    viewBox: '0 0 300 280',
    svgContent: `
<rect x="0" y="0" width="300" height="280" fill="#f8fafc" rx="8"/>
<!-- Great vessels top -->
<path d="M 95 20 L 95 60" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>
<path d="M 180 20 L 180 60" stroke="#3498db" stroke-width="18" stroke-linecap="round" fill="none"/>
<path d="M 60 50 L 95 60" stroke="#e74c3c" stroke-width="12" stroke-linecap="round" fill="none"/>
<path d="M 215 50 L 180 60" stroke="#3498db" stroke-width="12" stroke-linecap="round" fill="none"/>
<!-- Heart outline -->
<path d="M 60 60 Q 50 90 55 130 L 55 190 Q 60 230 150 260 Q 240 230 245 190 L 245 130 Q 250 90 240 60 Z"
  fill="#fff5f5" stroke="#c0392b" stroke-width="2"/>
<!-- Septum -->
<path d="M 148 65 L 148 255" stroke="#c0392b" stroke-width="2" stroke-dasharray="5,3"/>
<!-- AV valves line -->
<path d="M 60 145 L 240 145" stroke="#8e44ad" stroke-width="1.5" stroke-dasharray="4,3"/>
<!-- Labels: chamber areas -->
<!-- Right atrium upper right -->
<!-- Left atrium upper left -->
<!-- Right ventricle lower right -->
<!-- Left ventricle lower left -->
<!-- Pulmonary artery right top -->
<!-- Aorta left top -->
<!-- SVC / IVC right side -->
<path d="M 245 90 L 270 75" stroke="#3498db" stroke-width="10" stroke-linecap="round" fill="none"/>
<path d="M 245 170 L 270 185" stroke="#3498db" stroke-width="10" stroke-linecap="round" fill="none"/>
<!-- Pulmonary veins left side -->
<path d="M 55 95 L 30 80" stroke="#e74c3c" stroke-width="8" stroke-linecap="round" fill="none"/>
<path d="M 55 165 L 30 180" stroke="#e74c3c" stroke-width="8" stroke-linecap="round" fill="none"/>
`,
    regions: [
      { id: 'ra',  label: 'Right Atrium',      cx: 200, cy:  95, description: 'Receives deoxygenated blood from SVC and IVC; thin-walled.' },
      { id: 'la',  label: 'Left Atrium',       cx: 100, cy:  95, description: 'Receives oxygenated blood from pulmonary veins; thin-walled.' },
      { id: 'rv',  label: 'Right Ventricle',   cx: 200, cy: 185, description: 'Pumps blood to lungs via pulmonary artery; thinner wall than LV.' },
      { id: 'lv',  label: 'Left Ventricle',    cx: 100, cy: 185, description: 'Pumps blood to systemic circulation via aorta; thickest wall (3× RV).' },
      { id: 'ao',  label: 'Aorta',             cx:  95, cy:  18, description: 'Largest systemic artery, arising from left ventricle.' },
      { id: 'pa',  label: 'Pulmonary Artery',  cx: 180, cy:  18, description: 'Carries deoxygenated blood from RV to lungs.' },
      { id: 'svc', label: 'Cranial Vena Cava', cx: 272, cy:  72, description: 'Returns blood from head, neck, and forelimbs to RA.' },
      { id: 'ivc', label: 'Caudal Vena Cava',  cx: 272, cy: 188, description: 'Returns blood from abdomen, hindlimbs to RA.' },
    ],
  },
  {
    id: 'ruminant-stomach',
    title: 'Ruminant Forestomach Compartments (Schematic)',
    competencyId: 'Veterinary Anatomy:C.3',
    description: 'Identify the four compartments of the ruminant stomach.',
    source: 'Original schematic. Cf. Dyce KM, Sack WO, Wensing CJG. Textbook of Veterinary Anatomy, 4th ed. (Saunders, 2010), Ch. 20.',
    viewBox: '0 0 320 260',
    svgContent: `
<rect x="0" y="0" width="320" height="260" fill="#f8fafc" rx="8"/>
<!-- Rumen (large, left) -->
<ellipse cx="95" cy="140" rx="80" ry="95" fill="#e8f4f8" stroke="#2980b9" stroke-width="2"/>
<!-- Reticulum (small, top left) -->
<circle cx="145" cy="60" r="38" fill="#eaf4ea" stroke="#27ae60" stroke-width="2"/>
<!-- Omasum (round, centre right) -->
<circle cx="215" cy="105" r="42" fill="#fef9e7" stroke="#f39c12" stroke-width="2"/>
<!-- Abomasum (elongated, bottom right) -->
<path d="M 190 185 Q 210 165 250 170 Q 300 175 305 205 Q 305 240 265 245 Q 220 248 190 230 Z"
  fill="#fdecea" stroke="#e74c3c" stroke-width="2"/>
<!-- Connections -->
<path d="M 145 60 L 175 60" stroke="#888" stroke-width="1.5" stroke-dasharray="4,2" fill="none"/>
<path d="M 175 95 L 195 105" stroke="#888" stroke-width="1.5" stroke-dasharray="4,2" fill="none"/>
<path d="M 215 147 L 215 165" stroke="#888" stroke-width="1.5" stroke-dasharray="4,2" fill="none"/>
<!-- Esophagus -->
<path d="M 95 45 L 115 55" stroke="#888" stroke-width="3" stroke-linecap="round" fill="none"/>
<!-- Duodenum -->
<path d="M 300 215 L 318 215" stroke="#888" stroke-width="3" stroke-linecap="round" fill="none"/>
`,
    regions: [
      { id: 'rum', label: 'Rumen',      cx:  70, cy: 145, description: 'Largest compartment; primary fermentation vat. Contains papillae for absorption of VFAs. ~80–100 L in adult cattle.' },
      { id: 'ret', label: 'Reticulum',  cx: 145, cy:  60, description: 'Honeycomb-lined; communication with rumen; traps hardware. Site of traumatic reticuloperitonitis (hardware disease).' },
      { id: 'oma', label: 'Omasum',     cx: 215, cy: 105, description: 'Many muscular laminae (leaves) → water and VFA absorption, grinding of ingesta.' },
      { id: 'abo', label: 'Abomasum',   cx: 248, cy: 210, description: 'True stomach; glandular, secretes HCl and pepsin. Left displacement (LDA) is common periparturient condition.' },
    ],
  },
  {
    id: 'neuron-structure',
    title: 'Neuron Structure (Schematic)',
    competencyId: 'Veterinary Anatomy:E.1',
    description: 'Identify the structural components of a typical multipolar neuron.',
    source: 'Original schematic. Cf. de Lahunta A, Glass EN. Veterinary Neuroanatomy and Clinical Neurology, 3rd ed. (Saunders, 2009), Ch. 1.',
    viewBox: '0 0 320 200',
    svgContent: `
<rect x="0" y="0" width="320" height="200" fill="#f8fafc" rx="8"/>
<!-- Cell body (soma) -->
<circle cx="150" cy="100" r="30" fill="#fff3cd" stroke="#f39c12" stroke-width="2"/>
<!-- Nucleus -->
<circle cx="150" cy="100" r="12" fill="#fde8a0" stroke="#d68910" stroke-width="1.5"/>
<!-- Axon hillock and axon -->
<path d="M 180 100 L 220 100 L 230 100" stroke="#c0392b" stroke-width="4" stroke-linecap="round" fill="none"/>
<!-- Myelin sheath segments -->
<rect x="210" y="94" width="20" height="12" rx="4" fill="#fadbd8" stroke="#c0392b" stroke-width="1"/>
<rect x="240" y="94" width="20" height="12" rx="4" fill="#fadbd8" stroke="#c0392b" stroke-width="1"/>
<!-- Nodes of Ranvier -->
<line x1="230" y1="94" x2="230" y2="106" stroke="#e74c3c" stroke-width="1.5"/>
<!-- Axon terminal -->
<path d="M 260 100 L 285 90 M 260 100 L 285 100 M 260 100 L 285 110" stroke="#c0392b" stroke-width="2" stroke-linecap="round" fill="none"/>
<!-- Dendrites -->
<path d="M 125 85 L 95 60 M 120 100 L 80 100 M 125 115 L 95 140" stroke="#2980b9" stroke-width="2.5" stroke-linecap="round" fill="none"/>
<!-- Dendrite branches -->
<path d="M 95 60 L 70 48 M 95 60 L 78 72" stroke="#2980b9" stroke-width="1.5" stroke-linecap="round" fill="none"/>
<path d="M 80 100 L 60 90 M 80 100 L 60 110" stroke="#2980b9" stroke-width="1.5" stroke-linecap="round" fill="none"/>
`,
    regions: [
      { id: 'soma',    label: 'Cell body (soma)',   cx: 150, cy: 100, description: 'Contains nucleus and organelles. Nissl substance (rough ER) synthesises proteins.' },
      { id: 'nucleus', label: 'Nucleus',            cx: 150, cy: 100, description: 'Large, pale, with prominent nucleolus. Loss indicates chromatolysis (axon injury response).' },
      { id: 'axon',    label: 'Axon',               cx: 245, cy:  88, description: 'Single long process conducting impulses away from cell body. Originates at axon hillock.' },
      { id: 'myelin',  label: 'Myelin sheath',      cx: 250, cy: 108, description: 'Lipid-rich insulation laid down by Schwann cells (PNS) or oligodendrocytes (CNS). Saltatory conduction.' },
      { id: 'dendrite',label: 'Dendrites',          cx:  85, cy:  85, description: 'Multiple branching processes receiving input from other neurons via synapses.' },
      { id: 'terminal',label: 'Axon terminal',      cx: 285, cy:  98, description: 'Contains synaptic vesicles with neurotransmitters. Releases NT into synaptic cleft.' },
    ],
  },
];

export function getHotspot(id: string): HotspotDiagram | undefined {
  return HOTSPOT_DIAGRAMS.find((d) => d.id === id);
}
