import type { Question } from '@/types/question';

/** Escape HTML special characters for use in HTML-mode Anki fields. */
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Normalize a string to a valid Anki tag (no spaces, colons, dots). */
function toTag(s: string): string {
  return s.replace(/[\s:.]/g, '_').replace(/[^A-Za-z0-9_-]/g, '');
}

function buildFront(q: Question): string {
  const choices = q.choices.map((c) => `${c.key}. ${escHtml(c.text)}`).join('<br>');
  return `${escHtml(q.stem)}<br><br>${choices}`;
}

function buildBack(q: Question): string {
  const answerChoice = q.choices.find((c) => c.key === q.answer);
  const answerLine = `<b>Answer: ${q.answer}.</b> ${escHtml(answerChoice?.text ?? '')}`;
  return `${answerLine}<br><br>${escHtml(q.explanation)}`;
}

function buildTags(q: Question): string {
  const tags = ['dvmreview', toTag(q.vmleSubject), toTag(q.competencyId)];
  return tags.join(' ');
}

const ANKI_HEADER = '#separator:tab\n#html:true\n#tags column:3\n';

export function questionsToAnkiTsv(questions: Question[]): string {
  const rows = questions.map((q) => {
    const front = buildFront(q);
    const back = buildBack(q);
    const tags = buildTags(q);
    return `${front}\t${back}\t${tags}`;
  });
  return ANKI_HEADER + rows.join('\n');
}

export function downloadAnkiTsv(questions: Question[], filename?: string): void {
  const tsv = questionsToAnkiTsv(questions);
  const blob = new Blob([tsv], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `dvmreview-anki-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
