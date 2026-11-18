import {useId} from 'react';
import {FOLDER_COVERS} from './libraryModel';

interface FolderCoverPickerProps {
  value: string;
  onChange: (src: string) => void;
  legend?: string;
}

/** Radio-card picker over `FOLDER_COVERS` plus "Sin portada" (empty string). */
export function FolderCoverPicker({value, onChange, legend = 'Portada (opcional)'}: FolderCoverPickerProps) {
  const coverName = useId();
  const coverOptions = [{id: '', label: 'Sin portada', src: ''}, ...FOLDER_COVERS.map((c) => ({...c}))];
  return (
    <fieldset>
      <legend className="mb-2 text-label text-strong">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        {coverOptions.map((c) => {
          const selected = value === c.src;
          return (
            <label
              key={c.id || 'none'}
              className={`relative flex min-h-11 w-32 cursor-pointer flex-col overflow-hidden rounded-control border text-small has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                selected ? 'border-ink bg-primary-tint' : 'border-rule bg-surface hover:border-ink'
              }`}
            >
              <input
                type="radio"
                name={coverName}
                checked={selected}
                onChange={() => onChange(c.src)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
              {c.src ? <img src={c.src} alt="" className="aspect-[16/7] w-full object-cover" /> : null}
              <span className="px-2 py-2 text-strong">{c.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
