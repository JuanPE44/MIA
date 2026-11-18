export type MainSegment = 'CHAT' | 'FUENTES' | 'ARTEFACTOS' | 'ESTUDIO';

export type SourceType = 'text' | 'pdf' | 'link' | 'image' | 'video' | 'audio';

export interface SourceItem {
  id: string;
  type: SourceType;
  title: string;
  content: string;
  sourceUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
  mimeType?: string;
  uploadDate: string;
  wordCount: number;
  selectedForChat?: boolean;
  isProcessed?: boolean;
  isAnalyzing?: boolean;
  analysisSummary?: string;
  processedConcepts?: {
    term: string;
    definition: string;
    importance?: 'clave' | 'alta' | 'media';
  }[];
  processedKeyDetails?: string[];
  processedAuthors?: string[];
}

export interface SourceAnalysis {
  mainTopic: string;
  subtopics: string[];
  keyConcepts: {
    term: string;
    definition: string;
    importance: 'clave' | 'alta' | 'media';
  }[];
  structure: string[];
  mentionedAuthors: string[];
  importantDefinitions: {
    term: string;
    explanation: string;
  }[];
  conceptRelationships: string[];
  evaluationPoints: string[];
  analyzedAt: string;
}

export type ArtifactType =
  | 'resumen'
  | 'cuestionario'
  | 'flashcards'
  | 'guia'
  | 'modelo_examen'
  | 'audio_podcast'
  | 'infografia'
  | 'presentacion';

export interface ArtifactPersonalization {
  quality: 'bajo' | 'medio' | 'alto' | 'detallista';
  format: 'texto' | 'punteo' | 'brainstorming' | 'jerarquico';
  length: 'conciso' | 'intermedio' | 'detallado';
  citeSources: boolean;
  keepTitles: boolean;
  highlightAuthors: boolean;
  authorHighlightColor?: string;
  addExamples: boolean;
  generateGraphics: boolean;
  generateIndex: boolean;
}

export interface StudyArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  createdAt: string;
  personalization: ArtifactPersonalization;
  summaryText: string;
  citations: string[];
  structuredData?: any;
  feedback?: {
    rating?: 'positive' | 'negative';
    improvementRequested?: boolean;
    comments?: string[];
  };
}

export interface CitationChunk {
  index: number;
  sourceTitle: string;
  sectionTitle: string;
  location: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourcesCited?: string[];
  retrievedChunks?: CitationChunk[];
  isGroundingWarning?: boolean;
  suggestArtifactAction?: boolean;
  feedback?: 'positive' | 'negative' | 'improvement';
  feedbackComment?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface Notebook {
  id: string;
  folderId?: string | null;
  title: string;
  description: string;
  subject: string;
  category: 'emprendimiento' | 'ciencias' | 'humanidades' | 'tecnologia';
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  sources: SourceItem[];
  analysis?: SourceAnalysis | null;
  artifacts: StudyArtifact[];
  chatMessages: ChatMessage[];
  chatThreads?: ChatThread[];
  activeChatThreadId?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  notebookCount?: number;
  coverImage?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  degree: string;
  university: string;
  academicTerm: string;
  avatarSeed: string;
}

export interface DailyStudyLog {
  day: string;
  fullDay: string;
  date: string;
  minutes: number;
  targetMinutes: number;
  sessions: number;
}

export interface UserStudyStats {
  focusMinutesToday: number;
  totalFocusHours: number;
  currentStreakDays: number;
  xpPoints: number;
  sessionsCompleted: number;
  flashcardsMastered: number;
  tamperAttemptsBlocked: number;
  weeklyLogs?: DailyStudyLog[];
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  category: string;
  mastered?: boolean;
}
