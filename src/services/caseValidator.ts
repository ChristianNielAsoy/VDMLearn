import type { CaseDef, CaseNode } from '@/types/case';

export interface CaseValidationError {
  code: string;
  message: string;
}

export interface CaseValidationResult {
  valid: boolean;
  errors: CaseValidationError[];
  warnings: string[];
}

function err(code: string, message: string): CaseValidationError {
  return { code, message };
}

export function validateCase(def: CaseDef): CaseValidationResult {
  const errors: CaseValidationError[] = [];
  const warnings: string[] = [];

  if (!def.id) errors.push(err('MISSING_ID', 'Case must have an id'));
  if (!def.title) errors.push(err('MISSING_TITLE', 'Case must have a title'));
  if (!def.startNodeId) errors.push(err('MISSING_START', 'Case must have a startNodeId'));
  if (!def.nodes || def.nodes.length === 0) {
    errors.push(err('NO_NODES', 'Case must have at least one node'));
    return { valid: false, errors, warnings };
  }

  const nodeMap = new Map<string, CaseNode>(def.nodes.map((n) => [n.id, n]));

  // startNodeId must exist
  if (!nodeMap.has(def.startNodeId)) {
    errors.push(err('BAD_START', `startNodeId "${def.startNodeId}" does not exist in nodes`));
  }

  for (const node of def.nodes) {
    if (!node.id) {
      errors.push(err('NODE_MISSING_ID', 'Every node must have an id'));
      continue;
    }
    if (!node.kind) errors.push(err('NODE_MISSING_KIND', `Node "${node.id}" is missing kind`));
    if (!node.content) warnings.push(`Node "${node.id}" has no content`);

    if (node.kind === 'decision') {
      if (!node.choices || node.choices.length < 2) {
        errors.push(err('DECISION_FEW_CHOICES', `Decision node "${node.id}" must have at least 2 choices`));
      } else {
        const hasCorrect = node.choices.some((c) => c.correct);
        if (!hasCorrect) warnings.push(`Decision node "${node.id}" has no correct choice marked`);
        for (const choice of node.choices) {
          if (!choice.id) errors.push(err('CHOICE_MISSING_ID', `A choice in node "${node.id}" is missing an id`));
          if (!choice.next) {
            errors.push(err('CHOICE_MISSING_NEXT', `Choice "${choice.id}" in node "${node.id}" is missing next`));
          } else if (!nodeMap.has(choice.next)) {
            errors.push(err('CHOICE_BAD_NEXT', `Choice "${choice.id}" in node "${node.id}" points to non-existent node "${choice.next}"`));
          }
          if (choice.correct && choice.points <= 0) {
            warnings.push(`Correct choice "${choice.id}" in node "${node.id}" has 0 points`);
          }
        }
      }
      if (node.next) warnings.push(`Decision node "${node.id}" has a "next" field which will be ignored`);
    } else if (node.kind === 'outcome') {
      if (node.next) warnings.push(`Outcome node "${node.id}" has a "next" field which will be ignored`);
      if (node.choices) warnings.push(`Outcome node "${node.id}" has choices which will be ignored`);
      if (!node.finalDiagnosis) warnings.push(`Outcome node "${node.id}" has no finalDiagnosis`);
    } else {
      // signalment, history, exam, labs, imaging
      if (!node.next) {
        errors.push(err('NODE_MISSING_NEXT', `Node "${node.id}" (${node.kind}) must have a "next" field`));
      } else if (!nodeMap.has(node.next)) {
        errors.push(err('NODE_BAD_NEXT', `Node "${node.id}" points to non-existent node "${node.next}"`));
      }
    }
  }

  // Reachability: BFS from startNodeId
  if (errors.length === 0) {
    const visited = new Set<string>();
    const queue = [def.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodeMap.get(id)!;
      if (node.kind === 'decision') {
        for (const c of node.choices ?? []) {
          if (!visited.has(c.next)) queue.push(c.next);
        }
      } else if (node.kind !== 'outcome' && node.next) {
        if (!visited.has(node.next)) queue.push(node.next);
      }
    }
    for (const node of def.nodes) {
      if (!visited.has(node.id)) {
        warnings.push(`Node "${node.id}" is unreachable from startNodeId`);
      }
    }

    // Check all paths eventually reach an outcome
    const reachesOutcome = (nodeId: string, seen: Set<string>): boolean => {
      if (seen.has(nodeId)) return false; // cycle
      const node = nodeMap.get(nodeId);
      if (!node) return false;
      if (node.kind === 'outcome') return true;
      const next = new Set([...seen, nodeId]);
      if (node.kind === 'decision') {
        return (node.choices ?? []).every((c) => reachesOutcome(c.next, next));
      }
      return node.next ? reachesOutcome(node.next, next) : false;
    };
    if (!reachesOutcome(def.startNodeId, new Set())) {
      warnings.push('Not all paths from startNodeId reach an outcome node');
    }
  }

  // Validate maxScore
  const computedMax = def.nodes
    .filter((n) => n.kind === 'decision')
    .reduce((sum, n) => {
      const best = Math.max(...(n.choices ?? []).map((c) => c.points));
      return sum + (best > 0 ? best : 0);
    }, 0);
  if (def.maxScore !== computedMax) {
    warnings.push(`maxScore is ${def.maxScore} but computed max from choices is ${computedMax}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
