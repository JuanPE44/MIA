import type {ReactNode} from 'react';
import {createElement} from 'react';
import {FileText, Film, Image as ImageIcon, Link as LinkIcon, Mic, Type} from 'lucide-react';
import type {SourceItem, SourceType} from '../../types';

/** Files above this size trigger the browser-storage warning. */
export const LARGE_FILE_BYTES = 2 * 1024 * 1024;
/** Hard limit: the API accepts 20 MB JSON bodies and base64 adds ~33%. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const FILE_ACCEPT = 'application/pdf,image/*,audio/*,video/*,text/*,.md,.csv,.json,.txt';
export const ACCEPTED_LABEL = 'PDF, imágenes, audio, video o texto (.txt, .md, .csv, .json)';
export const MAX_SIZE_LABEL = 'Máximo 10 MB';

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  pdf: 'PDF',
  image: 'Imagen',
  audio: 'Audio',
  video: 'Video',
  link: 'Enlace',
  text: 'Texto',
};

const TYPE_ICON = {
  pdf: FileText,
  image: ImageIcon,
  audio: Mic,
  video: Film,
  link: LinkIcon,
  text: Type,
} as const;

/** Tint tile classes per type (token utilities only). */
export const TYPE_TILE: Record<SourceType, string> = {
  pdf: 'bg-tile-rosa',
  image: 'bg-tile-lima',
  audio: 'bg-tile-durazno',
  video: 'bg-tile-violeta',
  link: 'bg-tile-azul',
  text: 'bg-tile-gris',
};

export function typeIcon(type: SourceType, className = 'size-5'): ReactNode {
  return createElement(TYPE_ICON[type], {'aria-hidden': true, className});
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
}

export function detectType(file: File): SourceType {
  const mime = file.type || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'text';
}

/** Row meta line: type, size or word count, date. */
export function sourceMeta(source: SourceItem): string {
  const parts = [SOURCE_TYPE_LABEL[source.type]];
  if (source.fileSize) parts.push(source.fileSize);
  else if (source.wordCount) parts.push(`${source.wordCount} palabras`);
  if (source.uploadDate) parts.push(source.uploadDate);
  return parts.join(' · ');
}

/**
 * Validates a URL typed by the student. Accepts "ejemplo.com" by assuming https.
 * Returns the normalized URL or an error message in Spanish.
 */
export function parseUrl(raw: string): {url: string} | {error: string} {
  const value = raw.trim();
  if (!value) return {error: 'Escribe el enlace de la página.'};
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes('.')) {
      return {error: 'El enlace no parece válido. Ejemplo: https://sitio.com/articulo'};
    }
    return {url: parsed.toString()};
  } catch {
    return {error: 'El enlace no parece válido. Ejemplo: https://sitio.com/articulo'};
  }
}

export interface ExtractedFile {
  type: SourceType;
  mimeType: string;
  dataUrl?: string;
  content: string;
  title?: string;
}

function readAs(file: File, mode: 'dataUrl' | 'text'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    if (mode === 'dataUrl') reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

/**
 * Reads a file and asks the server to extract its text (same endpoint and
 * payload as the legacy screen). Falls back to a placeholder text on failure.
 */
export async function extractFile(file: File): Promise<ExtractedFile> {
  const name = file.name;
  const mimeType = file.type || 'application/octet-stream';
  const type = detectType(file);
  const lower = name.toLowerCase();
  const fallback =
    type === 'image'
      ? `Foto de apuntes cargada: "${name}". Puedes editar o agregar notas de la imagen aquí.`
      : `Archivo cargado: "${name}" (${formatBytes(file.size)}). Puedes revisar y agregar apuntes complementarios aquí.`;

  let dataUrl: string | undefined;
  try {
    dataUrl = await readAs(file, 'dataUrl');
    let clientText = '';
    if (
      mimeType.startsWith('text/') ||
      ['.txt', '.md', '.json', '.csv'].some((ext) => lower.endsWith(ext))
    ) {
      clientText = await readAs(file, 'text').catch(() => '');
    }

    const res = await fetch('/api/extract-file-content', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({fileName: name, mimeType, fileBase64: dataUrl, clientText: clientText || undefined}),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.extractedText) {
        return {type, mimeType, dataUrl, content: data.extractedText, title: data.title};
      }
    }
    return {type, mimeType, dataUrl, content: clientText || fallback};
  } catch {
    return {type, mimeType, dataUrl, content: fallback};
  }
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
}
