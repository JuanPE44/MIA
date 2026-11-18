import {apiFetch} from '../../services/api';
import type {ArtifactPersonalization, ArtifactType, SourceItem, StudyArtifact} from '../../types';
import {materialTypeOf} from './materialModel';

export interface GenerateRequest {
  type: ArtifactType;
  personalization: ArtifactPersonalization;
  sources: SourceItem[];
  notebookTitle: string;
}

/** `POST /api/generate-artifact` (same payload as the legacy component). */
export async function generateMaterial(req: GenerateRequest): Promise<StudyArtifact> {
  const res = await apiFetch('/api/generate-artifact', {
    method: 'POST',
    body: JSON.stringify({
      artifactType: req.type,
      personalization: req.personalization,
      sources: req.sources,
      notebookTitle: req.notebookTitle,
    }),
  });
  if (!res.ok) throw new Error('Error del servidor');
  const data = await res.json();
  const generated = data.artifact;
  if (!generated) throw new Error('Respuesta vacía');

  return {
    id: `art-${Date.now()}`,
    type: req.type,
    title: generated.title || `${materialTypeOf(req.type).label}: ${req.notebookTitle}`,
    createdAt: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    personalization: req.personalization,
    summaryText: generated.summaryText || '',
    citations: generated.citations || req.sources.map((s) => `Fuente: ${s.title}`),
    structuredData: generated.structuredData,
  };
}

/** `POST /api/refine-artifact` (same payload as the legacy component). Returns the new text. */
export async function refineMaterial(
  artifact: StudyArtifact,
  comment: string,
  sources: SourceItem[],
): Promise<string> {
  const res = await apiFetch('/api/refine-artifact', {
    method: 'POST',
    body: JSON.stringify({
      currentContent: artifact.summaryText,
      feedbackType: 'custom_comment',
      comment,
      sources,
    }),
  });
  if (!res.ok) throw new Error('Error al refinar');
  const data = await res.json();
  if (typeof data.updatedContent !== 'string') throw new Error('Respuesta vacía');
  return data.updatedContent;
}
