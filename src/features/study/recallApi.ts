import type {Notebook} from '../../types';

export interface RecallChallenge {
  challengeQuestion: string;
  expectedKeyPoints: string[];
  canonicalAnswer: string;
  sourceReference: string;
}

/** Asks `/api/active-recall` for a question grounded in the notebook sources. Throws on failure. */
export async function requestChallenge(notebook: Pick<Notebook, 'sources' | 'title'>): Promise<RecallChallenge> {
  const res = await fetch('/api/active-recall', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({sources: notebook.sources, notebookTitle: notebook.title}),
  });
  if (!res.ok) throw new Error('active-recall failed');
  const data = await res.json();
  const c = data?.challenge;
  if (!c || typeof c.challengeQuestion !== 'string' || !c.challengeQuestion) throw new Error('invalid challenge');
  return {
    challengeQuestion: c.challengeQuestion,
    expectedKeyPoints: Array.isArray(c.expectedKeyPoints) ? c.expectedKeyPoints.map(String) : [],
    canonicalAnswer: typeof c.canonicalAnswer === 'string' ? c.canonicalAnswer : '',
    sourceReference: typeof c.sourceReference === 'string' ? c.sourceReference : '',
  };
}
