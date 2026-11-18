import {useRef, useState, type FormEvent} from 'react';
import {useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import type {SourceItem, SourceType} from '../../types';
import {
  Button,
  Dialog,
  FileDrop,
  InlineAlert,
  SegmentedControl,
  TextField,
  Textarea,
  useToast,
} from '../../ui';
import {WebSearchPanel} from '../web-search';
import {
  ACCEPTED_LABEL,
  FILE_ACCEPT,
  LARGE_FILE_BYTES,
  MAX_FILE_BYTES,
  MAX_SIZE_LABEL,
  extractFile,
  formatBytes,
  parseUrl,
  todayLabel,
  type ExtractedFile,
} from './sourceModel';

type Tab = 'file' | 'link' | 'text' | 'web';

const TABS: Array<{value: Tab; label: string}> = [
  {value: 'file', label: 'Archivo'},
  {value: 'link', label: 'Enlace'},
  {value: 'text', label: 'Texto'},
  {value: 'web', label: 'Desde la web'},
];

const FORM_ID = 'add-source-form';

interface PickedFile {
  file: File;
  extracted: ExtractedFile | null;
}

/** Single "Añadir fuente" entry: Archivo · Enlace · Texto · Desde la web. */
export function AddSourceDialog({open, onClose}: {open: boolean; onClose: () => void}) {
  if (!open) return null;
  return <AddSourceDialogInner onClose={onClose} />;
}

function AddSourceDialogInner({onClose}: {onClose: () => void}) {
  const {handleAddSource, sourceLimitReached} = useAppState();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('file');
  const [title, setTitle] = useState('');
  const titleTouched = useRef(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [errors, setErrors] = useState<{file?: string; title?: string; url?: string; text?: string}>({});
  const pickToken = useRef(0);

  const extracting = tab === 'file' && picked !== null && picked.extracted === null;
  const isLarge = picked !== null && picked.file.size > LARGE_FILE_BYTES;

  const onTitle = (value: string) => {
    titleTouched.current = true;
    setTitle(value);
    setErrors((e) => ({...e, title: undefined}));
  };

  const onFile = (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setErrors((e) => ({
        ...e,
        file: `«${file.name}» pesa ${formatBytes(file.size)} y supera el máximo de 3 MB por archivo. Elige un archivo más liviano o pega el texto en la pestaña Texto.`,
      }));
      return;
    }
    const token = ++pickToken.current;
    setErrors((e) => ({...e, file: undefined}));
    setPicked({file, extracted: null});
    if (!titleTouched.current) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    void extractFile(file).then((extracted) => {
      if (token !== pickToken.current) return;
      setPicked({file, extracted});
      if (extracted.title && !titleTouched.current) setTitle(extracted.title);
    });
  };

  const removeFile = () => {
    pickToken.current++;
    setPicked(null);
    if (!titleTouched.current) setTitle('');
  };

  const finish = (source: SourceItem) => {
    void handleAddSource(source);
    onClose();
    toast.show({variant: 'success', message: 'Fuente añadida'});
  };

  const base = (type: SourceType, sourceTitle: string, content: string): SourceItem => ({
    id: `src-${Date.now()}`,
    type,
    title: sourceTitle,
    content,
    uploadDate: todayLabel(),
    wordCount: content.split(/\s+/).filter(Boolean).length || 1,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (sourceLimitReached) return;
    if (tab === 'file') {
      if (!picked) return setErrors({file: 'Elige un archivo para añadir.'});
      if (!picked.extracted) return;
      const {file, extracted} = picked;
      const source = base(extracted.type, title.trim() || file.name, extracted.content);
      finish({
        ...source,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileDataUrl: extracted.dataUrl,
        mimeType: extracted.mimeType,
      });
    } else if (tab === 'link') {
      const parsed = parseUrl(url);
      if ('error' in parsed) return setErrors({url: parsed.error});
      let host = parsed.url;
      try {
        host = new URL(parsed.url).hostname;
      } catch {
        /* parseUrl already validated the URL */
      }
      finish({...base('link', title.trim() || host, `Enlace web: ${parsed.url}`), sourceUrl: parsed.url});
    } else if (tab === 'text') {
      const next: typeof errors = {};
      if (!title.trim()) next.title = 'Ponle un título a la fuente.';
      if (!text.trim()) next.text = 'Pega o escribe el texto de la fuente.';
      if (next.title || next.text) return setErrors(next);
      finish(base('text', title.trim(), text.trim()));
    }
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    setErrors({});
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size={tab === 'web' ? 'lg' : 'md'}
      title="Añadir fuente"
      description="El chat responde con las fuentes que actives en este cuaderno."
      footer={
        tab === 'web' ? (
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              variant="primary"
              disabled={extracting || sourceLimitReached}
              disabledReason={
                sourceLimitReached
                  ? 'Llegaste al límite de fuentes de tu plan'
                  : extracting
                    ? 'Espera a que termine de leerse el archivo'
                    : undefined
              }
            >
              Añadir
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {sourceLimitReached ? (
          <InlineAlert variant="warning" title="Llegaste al límite de tu plan">
            Este cuaderno ya tiene el máximo de fuentes de tu plan. Elimina alguna o{' '}
            <button type="button" className="underline" onClick={() => navigate(paths.plans())}>
              mejora tu plan
            </button>
            .
          </InlineAlert>
        ) : null}
        <SegmentedControl
          aria-label="Tipo de fuente"
          options={TABS}
          value={tab}
          onValueChange={changeTab}
          fullWidth
        />

        {tab === 'web' ? (
          <WebSearchPanel />
        ) : (
          <form id={FORM_ID} noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            {tab === 'file' ? (
              <>
                <FileDrop
                  onFileSelected={onFile}
                  selection={
                    picked
                      ? {name: picked.file.name, sizeLabel: formatBytes(picked.file.size), busy: picked.extracted === null}
                      : null
                  }
                  onRemove={removeFile}
                  accept={FILE_ACCEPT}
                  acceptedLabel={ACCEPTED_LABEL}
                  maxSizeLabel={MAX_SIZE_LABEL}
                  error={errors.file}
                />
                {isLarge && picked ? (
                  <InlineAlert variant="warning" title="Archivo grande">
                    Las fuentes se guardan en este navegador y su espacio es limitado. Un archivo de{' '}
                    {formatBytes(picked.file.size)} puede ocupar gran parte y hacer que no se guarden más cambios. Si solo
                    necesitas el texto, pégalo en la pestaña Texto.
                  </InlineAlert>
                ) : null}
                <TextField label="Título" value={title} onChange={(e) => onTitle(e.target.value)} error={errors.title} />
              </>
            ) : null}

            {tab === 'link' ? (
              <>
                <TextField
                  label="Enlace"
                  type="url"
                  inputMode="url"
                  placeholder="https://sitio.com/articulo"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setErrors((er) => ({...er, url: undefined}));
                  }}
                  error={errors.url}
                />
                <TextField
                  label="Título (opcional)"
                  value={title}
                  onChange={(e) => onTitle(e.target.value)}
                  helper="Si lo dejas vacío usamos el nombre del sitio."
                />
              </>
            ) : null}

            {tab === 'text' ? (
              <>
                <TextField label="Título" value={title} onChange={(e) => onTitle(e.target.value)} error={errors.title} />
                <Textarea
                  label="Texto"
                  minRows={6}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setErrors((er) => ({...er, text: undefined}));
                  }}
                  error={errors.text}
                />
              </>
            ) : null}
          </form>
        )}
      </div>
    </Dialog>
  );
}
