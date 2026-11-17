export type CaseNodeKind =
  | 'signalment'   // patient ID, species, age, sex
  | 'history'      // presenting complaint and anamnesis
  | 'exam'         // physical examination findings
  | 'labs'         // laboratory results
  | 'imaging'      // diagnostic imaging (radiograph, ultrasound)
  | 'decision'     // branching point requiring a choice
  | 'outcome';     // terminal node: final diagnosis and result

export interface CaseChoice {
  id: string;
  label: string;
  next: string;         // id of the target node
  correct: boolean;
  points: number;       // 0 for incorrect, >0 for correct / partial credit
  feedback: string;     // shown immediately after choosing
}

export interface CaseNode {
  id: string;
  kind: CaseNodeKind;
  title?: string;
  content: string;             // plain text (may contain simple markdown)
  next?: string;               // for non-decision nodes: advances to this node id
  choices?: CaseChoice[];      // for decision nodes only
  finalDiagnosis?: string;     // for outcome nodes
  competencyIds?: string[];    // competencies tested at this node
}

export interface CaseDef {
  id: string;
  title: string;
  species: string;             // e.g. 'Canine', 'Bovine', 'Feline'
  description: string;         // 1-2 sentence teaser shown in the list
  competencyIds: string[];     // all competencies this case covers
  source: string;
  verified: boolean;
  startNodeId: string;
  nodes: CaseNode[];
  maxScore: number;            // sum of all achievable correct-decision points
}

export interface CaseSessionStep {
  nodeId: string;
  choiceId?: string;
  choiceCorrect?: boolean;
  pointsEarned: number;
}

export interface CaseSession {
  id?: number;
  caseId: string;
  startedAt: number;
  completedAt?: number;
  score: number;
  maxScore: number;
  steps: CaseSessionStep[];
}
