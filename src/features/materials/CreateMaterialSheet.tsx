import {useEffect, useId, useRef, useState} from 'react';
import type {ArtifactPersonalization, ArtifactType, SourceItem} from '../../types';
import {Button, Checkbox, Dialog, SegmentedControl, Switch} from '../../ui';
import {cx} from '../../ui/internal/cx';
import {useMaterialJobs} from './MaterialsJobs';
import {
  AUTHOR_COLORS,
  FORMAT_OPTIONS,
  LENGTH_OPTIONS,
  MARK_TEXT_COLOR,
  QUALITY_OPTIONS,
  highlightColorOf,
  loadPersonalization,
  materialTypeOf,
  plural,
  savePersonalization,
} from './materialModel';
import {Icon} from '../../ui/Icon';

interface CreateMaterialSheetProps {
  type: ArtifactType | null;
  notebookId: string;
  notebookTitle: string;
  sources: SourceItem[];
  onClose: () => void;
}

function defaultSourceIds(sources: SourceItem[]): string[] {
  const active = sources.filter((s) => s.selectedForChat !== false).map((s) => s.id);
  return active.length > 0 ? active : sources.map((s) => s.id);
}

/**
 * Quick-create sheet. Extensión stays outside Personalizar (S6); the other
 * legacy options live in the collapsed region. Length is not duplicated.
 */
export function CreateMaterialSheet({type, notebookId, notebookTitle, sources, onClose}: CreateMaterialSheetProps) {
  const jobs = useMaterialJobs();
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  const [personalization, setPersonalization] = useState<ArtifactPersonalization>(() =>
    loadPersonalization(type ?? 'resumen'),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => defaultSourceIds(sources));
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const listId = useId();
  const panelId = useId();
  const qualityId = useId();
  const formatId = useId();
  const lengthId = useId();

  useEffect(() => {
    if (!type) return;
    setPersonalization(loadPersonalization(type));
    setSelectedIds(defaultSourceIds(sourcesRef.current));
    setSourcesOpen(false);
    setCustomizeOpen(false);
  }, [type]);

  const info = materialTypeOf(type ?? 'resumen');
  const selected = sources.filter((s) => selectedIds.includes(s.id));
  const color = highlightColorOf(personalization.authorHighlightColor);

  const patch = (partial: Partial<ArtifactPersonalization>) =>
    setPersonalization((prev) => ({...prev, ...partial}));

  const toggleSource = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const generate = () => {
    if (!type || selected.length === 0) return;
    savePersonalization(type, personalization);
    jobs.start(notebookId, {
      type,
      personalization,
      sources: selected,
      notebookTitle,
    });
    onClose();
  };

  return (
    <Dialog
      open={type !== null}
      onClose={onClose}
      size="md"
      title={`Crear ${info.noun}`}
      description={info.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={generate}
            disabled={selected.length === 0}
            disabledReason={selected.length === 0 ? 'Selecciona al menos una fuente' : undefined}
          >
            Generar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-body text-strong">
              Usando {plural(selected.length, 'fuente activa', 'fuentes activas')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={sourcesOpen}
              aria-controls={listId}
              onClick={() => setSourcesOpen((open) => !open)}
            >
              Cambiar
            </Button>
          </div>
          <div id={listId} hidden={!sourcesOpen} className="mt-2 max-h-48 overflow-auto rounded-control border border-hairline px-3">
            {sources.map((source) => (
              <Checkbox
                key={source.id}
                checked={selectedIds.includes(source.id)}
                onCheckedChange={(checked) => toggleSource(source.id, checked)}
                label={source.title}
              />
            ))}
          </div>
        </div>

        <div>
          <p id={lengthId} className="mb-2 text-label text-strong">
            Extensión
          </p>
          <SegmentedControl
            aria-labelledby={lengthId}
            fullWidth
            value={personalization.length}
            onValueChange={(length) => patch({length})}
            options={LENGTH_OPTIONS.map((option) => ({value: option.value, label: option.label}))}
          />
        </div>

        <div>
          <button
            type="button"
            aria-expanded={customizeOpen}
            aria-controls={panelId}
            onClick={() => setCustomizeOpen((open) => !open)}
            className="flex min-h-11 w-full items-center gap-2 rounded-control text-body-strong text-strong"
          >
            <Icon name="chevron-down" className={cx('size-4 transition-transform', customizeOpen && 'rotate-180')} />
            Personalizar
          </button>
          <div id={panelId} role="region" aria-label="Personalizar" hidden={!customizeOpen} className="mt-3 flex flex-col gap-5">
            <fieldset className="flex flex-col gap-4">
              <legend className="text-caption font-medium text-muted">Contenido</legend>
              <div>
                <p id={qualityId} className="mb-2 text-label text-strong">
                  Calidad
                </p>
                <div className="max-w-full overflow-x-auto pb-1">
                  <SegmentedControl
                    aria-labelledby={qualityId}
                    value={personalization.quality}
                    onValueChange={(quality) => patch({quality})}
                    options={QUALITY_OPTIONS.map((option) => ({value: option.value, label: option.label}))}
                  />
                </div>
              </div>
              <div>
                <p id={formatId} className="mb-2 text-label text-strong">
                  Formato
                </p>
                <div className="max-w-full overflow-x-auto pb-1">
                  <SegmentedControl
                    aria-labelledby={formatId}
                    value={personalization.format}
                    onValueChange={(format) => patch({format})}
                    options={FORMAT_OPTIONS.map((option) => ({value: option.value, label: option.label}))}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-caption font-medium text-muted">Estilo</legend>
              <Switch
                checked={personalization.keepTitles}
                onCheckedChange={(keepTitles) => patch({keepTitles})}
                label="Mantener títulos"
                description="Conserva títulos y subtítulos de las fuentes de texto."
              />
              <Switch
                checked={personalization.highlightAuthors}
                onCheckedChange={(highlightAuthors) => patch({highlightAuthors})}
                label="Resaltar autores"
                description="Destaca a los referentes teóricos con un color."
              />
              {personalization.highlightAuthors ? (
                <div role="radiogroup" aria-label="Color para resaltar autores" className="flex flex-wrap gap-2 py-2 pl-1">
                  {AUTHOR_COLORS.map((option) => {
                    const selectedColor = personalization.authorHighlightColor === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selectedColor}
                        onClick={() => patch({authorHighlightColor: option.id})}
                        className={cx(
                          'inline-flex min-h-11 items-center gap-2 rounded-pill border px-3 text-label text-strong',
                          selectedColor ? 'border-strong' : 'border-hairline',
                        )}
                      >
                        <span aria-hidden className="size-4 rounded-pill border border-hairline" style={{backgroundColor: option.bg}} />
                        {option.label}
                      </button>
                    );
                  })}
                  <span className="flex min-h-11 items-center text-small text-muted">
                    Vista previa:
                    <mark
                      className="ml-2 rounded-small px-1.5 py-0.5 text-caption font-semibold"
                      style={{backgroundColor: color.bg, color: MARK_TEXT_COLOR}}
                    >
                      Eric Ries
                    </mark>
                  </span>
                </div>
              ) : null}
              <Switch
                checked={personalization.addExamples}
                onCheckedChange={(addExamples) => patch({addExamples})}
                label="Agregar ejemplos"
                description="Si se desactiva, el texto se queda en definiciones."
              />
              <Switch
                checked={personalization.generateGraphics}
                onCheckedChange={(generateGraphics) => patch({generateGraphics})}
                label="Generar gráficos"
                description="Incluye diagramas y mapas de apoyo."
              />
              <Switch
                checked={personalization.generateIndex}
                onCheckedChange={(generateIndex) => patch({generateIndex})}
                label="Generar índice"
                description="Índice con enlaces a los títulos generados."
              />
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-caption font-medium text-muted">Fuentes</legend>
              <Switch
                checked={personalization.citeSources}
                onCheckedChange={(citeSources) => patch({citeSources})}
                label="Citar fuentes"
                description="Inserta referencias a cada fuente dentro del texto."
              />
            </fieldset>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
