import {apiFetch} from '../../services/api';
import type {Notebook} from '../../types';

export interface RecallChallenge {
  challengeQuestion: string;
  expectedKeyPoints: string[];
  canonicalAnswer: string;
  sourceReference: string;
}

/** Asks `/api/active-recall` for a question grounded in the notebook sources. Throws on failure. */
export async function requestChallenge(notebook: Pick<Notebook, 'sources' | 'title'>): Promise<RecallChallenge> {
  const res = await apiFetch('/api/active-recall', {
    method: 'POST',
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

export interface RecallEvaluation {
  score: number;
  level: 'alto' | 'medio' | 'bajo';
  hitTerms: string[];
  missedTerms: string[];
  feedback: string;
}

/** Scores the student's answer against the reference. Returns null when the service cannot evaluate it. */
export async function evaluateAnswer(
  notebook: Pick<Notebook, 'sources' | 'title'>,
  challenge: RecallChallenge,
  userAnswer: string,
): Promise<RecallEvaluation | null> {
  try {
    const res = await apiFetch('/api/active-recall', {
      method: 'POST',
      body: JSON.stringify({sources: notebook.sources, notebookTitle: notebook.title, userAnswer, challenge}),
    });
    if (!res.ok) return null;
    const e = (await res.json())?.evaluation;
    if (!e || typeof e.score !== 'number' || typeof e.feedback !== 'string') return null;
    return {
      score: e.score,
      level: e.level === 'alto' || e.level === 'medio' ? e.level : 'bajo',
      hitTerms: Array.isArray(e.hitTerms) ? e.hitTerms.map(String) : [],
      missedTerms: Array.isArray(e.missedTerms) ? e.missedTerms.map(String) : [],
      feedback: e.feedback,
    };
  } catch {
    return null;
  }
}
