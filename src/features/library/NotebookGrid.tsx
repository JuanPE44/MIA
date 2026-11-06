import type {ReactNode} from 'react';

/** Spec 4.2: auto-fill 260 px columns, gap 24 (16 on phone). */
export function NotebookGrid({children}: {children: ReactNode}) {
  return (
    <div className="grid gap-4 sm:gap-6" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))'}}>
      {children}
    </div>
  );
}
