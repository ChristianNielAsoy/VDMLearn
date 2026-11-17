import type { CaseDef, CaseNode, CaseSessionStep } from '@/types/case';

export interface CaseState {
  def: CaseDef;
  currentNodeId: string;
  steps: CaseSessionStep[];
  score: number;
  complete: boolean;
}

export interface DebriefDecision {
  nodeId: string;
  nodeTitle: string;
  choiceId: string;
  choiceLabel: string;
  correct: boolean;
  feedback: string;
  pointsEarned: number;
  bestPoints: number;
}

export interface CaseDebrief {
  score: number;
  maxScore: number;
  pct: number;
  finalDiagnosis: string | undefined;
  decisions: DebriefDecision[];
}

export function startCase(def: CaseDef): CaseState {
  return {
    def,
    currentNodeId: def.startNodeId,
    steps: [],
    score: 0,
    complete: false,
  };
}

export function getCurrentNode(state: CaseState): CaseNode | undefined {
  return state.def.nodes.find((n) => n.id === state.currentNodeId);
}

/** Advance a non-decision node (signalment, history, exam, labs, imaging). */
export function advanceNode(state: CaseState): CaseState {
  const node = getCurrentNode(state);
  if (!node || node.kind === 'decision' || node.kind === 'outcome') return state;

  const step: CaseSessionStep = { nodeId: node.id, pointsEarned: 0 };
  const steps = [...state.steps, step];

  if (!node.next) {
    return { ...state, steps, complete: true };
  }

  const nextNode = state.def.nodes.find((n) => n.id === node.next);
  const complete = nextNode?.kind === 'outcome' && !nextNode.next;

  return {
    ...state,
    currentNodeId: node.next,
    steps,
    complete: complete && nextNode?.kind === 'outcome' && !nextNode.choices && !nextNode.next
      ? true
      : false,
  };
}

/** Select a choice on a decision node. Returns the state after moving to the next node. */
export function selectChoice(state: CaseState, choiceId: string): CaseState {
  const node = getCurrentNode(state);
  if (!node || node.kind !== 'decision') return state;

  const choice = (node.choices ?? []).find((c) => c.id === choiceId);
  if (!choice) return state;

  const step: CaseSessionStep = {
    nodeId: node.id,
    choiceId,
    choiceCorrect: choice.correct,
    pointsEarned: choice.points,
  };
  const steps = [...state.steps, step];
  const score = state.score + choice.points;
  const nextNode = state.def.nodes.find((n) => n.id === choice.next);

  return {
    ...state,
    currentNodeId: choice.next,
    steps,
    score,
    complete: nextNode?.kind === 'outcome' ? true : state.complete,
  };
}

/** Advance an outcome node (marks session complete). */
export function finalizeCase(state: CaseState): CaseState {
  const node = getCurrentNode(state);
  if (!node || node.kind !== 'outcome') return state;
  const step: CaseSessionStep = { nodeId: node.id, pointsEarned: 0 };
  return { ...state, steps: [...state.steps, step], complete: true };
}

export function getDebrief(state: CaseState): CaseDebrief {
  const decisions: DebriefDecision[] = [];

  for (const step of state.steps) {
    if (!step.choiceId) continue;
    const node = state.def.nodes.find((n) => n.id === step.nodeId);
    if (!node || node.kind !== 'decision') continue;
    const choice = (node.choices ?? []).find((c) => c.id === step.choiceId);
    if (!choice) continue;
    const bestPoints = Math.max(...(node.choices ?? []).map((c) => c.points));
    decisions.push({
      nodeId: node.id,
      nodeTitle: node.title ?? node.id,
      choiceId: step.choiceId,
      choiceLabel: choice.label,
      correct: choice.correct,
      feedback: choice.feedback,
      pointsEarned: step.pointsEarned,
      bestPoints,
    });
  }

  // Find the outcome node visited
  const outcomeStep = state.steps.find((s) => {
    const n = state.def.nodes.find((n) => n.id === s.nodeId);
    return n?.kind === 'outcome';
  });
  const outcomeNode = outcomeStep
    ? state.def.nodes.find((n) => n.id === outcomeStep.nodeId)
    : undefined;

  const pct = state.def.maxScore > 0 ? Math.round((state.score / state.def.maxScore) * 100) : 100;

  return {
    score: state.score,
    maxScore: state.def.maxScore,
    pct,
    finalDiagnosis: outcomeNode?.finalDiagnosis,
    decisions,
  };
}
