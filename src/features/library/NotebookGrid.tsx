import type {ReactNode} from 'react';
import {Reveal} from '../../ui';

/** Auto-fill 260 px columns, gap 24 (16 on phone). Children enter staggered, once. */
export function NotebookGrid({children}: {children: ReactNode}) {
  return (
    <Reveal
      as="ul"
      stagger={0.05}
      className="grid list-none grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4 p-0 sm:gap-6"
    >
      {children}
    </Reveal>
  );
}
