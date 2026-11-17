import { describe, it, expect } from 'vitest';
import { startCase, getCurrentNode, advanceNode, selectChoice, finalizeCase, getDebrief } from '@/services/caseRunner';
import type { CaseDef } from '@/types/case';

const simpleDef: CaseDef = {
  id: 'runner-test',
  title: 'Runner Test',
  species: 'Feline',
  description: 'Test case for caseRunner',
  competencyIds: [],
  source: 'Test',
  verified: false,
  startNodeId: 'n-sig',
  maxScore: 10,
  nodes: [
    { id: 'n-sig',  kind: 'signalment', content: 'Cat, 3yr, female', next: 'n-hist' },
    { id: 'n-hist', kind: 'history',    content: 'Vomiting 2 days',   next: 'n-dec' },
    {
      id: 'n-dec',
      kind: 'decision',
      content: 'What next?',
      choices: [
        { id: 'c-good', label: 'Ultrasound', next: 'n-out-good', correct: true,  points: 10, feedback: 'Excellent!' },
        { id: 'c-bad',  label: 'Send home',  next: 'n-out-bad',  correct: false, points: 0,  feedback: 'Missed it.' },
      ],
    },
    { id: 'n-out-good', kind: 'outcome', content: 'Intestinal foreign body found', finalDiagnosis: 'Linear foreign body' },
    { id: 'n-out-bad',  kind: 'outcome', content: 'Returned collapsed next day',   finalDiagnosis: 'Missed foreign body' },
  ],
};

describe('caseRunner', () => {
  it('startCase sets currentNodeId to startNodeId', () => {
    const state = startCase(simpleDef);
    expect(state.currentNodeId).toBe('n-sig');
    expect(state.score).toBe(0);
    expect(state.complete).toBe(false);
    expect(state.steps).toHaveLength(0);
  });

  it('getCurrentNode returns the current node', () => {
    const state = startCase(simpleDef);
    const node = getCurrentNode(state);
    expect(node?.id).toBe('n-sig');
    expect(node?.kind).toBe('signalment');
  });

  it('advanceNode moves to next node and records a step', () => {
    const state0 = startCase(simpleDef);
    const state1 = advanceNode(state0);
    expect(state1.currentNodeId).toBe('n-hist');
    expect(state1.steps).toHaveLength(1);
    expect(state1.steps[0]?.nodeId).toBe('n-sig');
  });

  it('advanceNode is a no-op on a decision node', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state); // sig → hist
    state = advanceNode(state); // hist → dec
    const beforeId = state.currentNodeId;
    const after = advanceNode(state); // should not advance (decision node)
    expect(after.currentNodeId).toBe(beforeId);
  });

  it('selectChoice with correct choice adds points and moves to next node', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state); // → hist
    state = advanceNode(state); // → dec
    const result = selectChoice(state, 'c-good');
    expect(result.currentNodeId).toBe('n-out-good');
    expect(result.score).toBe(10);
    expect(result.complete).toBe(true);
    expect(result.steps.some((s) => s.choiceId === 'c-good' && s.choiceCorrect === true)).toBe(true);
  });

  it('selectChoice with wrong choice gives 0 points', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state);
    state = advanceNode(state);
    const result = selectChoice(state, 'c-bad');
    expect(result.score).toBe(0);
    expect(result.currentNodeId).toBe('n-out-bad');
    expect(result.complete).toBe(true);
  });

  it('selectChoice with unknown choiceId is a no-op', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state);
    state = advanceNode(state);
    const result = selectChoice(state, 'nonexistent');
    expect(result.currentNodeId).toBe('n-dec');
    expect(result.score).toBe(0);
  });

  it('finalizeCase marks complete and records outcome step', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state);
    state = advanceNode(state);
    state = selectChoice(state, 'c-good');
    expect(state.complete).toBe(true);
    const finalized = finalizeCase(state);
    expect(finalized.complete).toBe(true);
  });

  it('getDebrief returns correct score, pct, and decisions', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state);
    state = advanceNode(state);
    state = selectChoice(state, 'c-good');
    state = finalizeCase(state);
    const debrief = getDebrief(state);
    expect(debrief.score).toBe(10);
    expect(debrief.maxScore).toBe(10);
    expect(debrief.pct).toBe(100);
    expect(debrief.finalDiagnosis).toBe('Linear foreign body');
    expect(debrief.decisions).toHaveLength(1);
    expect(debrief.decisions[0]?.correct).toBe(true);
  });

  it('getDebrief shows 0 pct for wrong path', () => {
    let state = startCase(simpleDef);
    state = advanceNode(state);
    state = advanceNode(state);
    state = selectChoice(state, 'c-bad');
    state = finalizeCase(state);
    const debrief = getDebrief(state);
    expect(debrief.score).toBe(0);
    expect(debrief.pct).toBe(0);
    expect(debrief.decisions[0]?.correct).toBe(false);
    expect(debrief.decisions[0]?.feedback).toBe('Missed it.');
  });

  it('complete flag is false until an outcome node is reached', () => {
    let state = startCase(simpleDef);
    expect(state.complete).toBe(false);
    state = advanceNode(state);
    expect(state.complete).toBe(false);
    state = advanceNode(state);
    expect(state.complete).toBe(false);
    state = selectChoice(state, 'c-good');
    expect(state.complete).toBe(true);
  });
});
