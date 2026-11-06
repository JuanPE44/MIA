import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import type {StudyArtifact} from '../../types';
import {ReadingPage} from './renderers/ReadingPage';
import './print.css';

const PRINT_EVENT = 'mia-print-material';

interface PrintJob {
  artifact: StudyArtifact;
  notebookTitle: string;
}

/** Same print path for the gallery and the viewer: the reading page, via window.print. */
export function requestMaterialPrint(artifact: StudyArtifact, notebookTitle: string) {
  window.dispatchEvent(new CustomEvent<PrintJob>(PRINT_EVENT, {detail: {artifact, notebookTitle}}));
}

/** Mounted next to MaterialsJobsProvider so print works from the gallery and the viewer. */
export function MaterialPrintHost() {
  const [job, setJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    const onPrint = (event: Event) => {
      const detail = (event as CustomEvent<PrintJob>).detail;
      if (detail?.artifact) setJob(detail);
    };
    window.addEventListener(PRINT_EVENT, onPrint);
    return () => window.removeEventListener(PRINT_EVENT, onPrint);
  }, []);

  useEffect(() => {
    if (!job) return;
    document.body.classList.add('mia-printing');
    const done = () => {
      document.body.classList.remove('mia-printing');
      setJob(null);
    };
    window.addEventListener('afterprint', done);
    window.print();
    return () => {
      window.removeEventListener('afterprint', done);
      document.body.classList.remove('mia-printing');
    };
  }, [job]);

  if (!job || typeof document === 'undefined') return null;
  return createPortal(
    <div className="mia-material-print">
      <ReadingPage artifact={job.artifact} notebookTitle={job.notebookTitle} />
    </div>,
    document.body,
  );
}
