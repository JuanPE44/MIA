import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {useAppState} from '../../app/AppStateContext';
import {paths} from '../../app/routes';
import type {ArtifactType} from '../../types';
import {useToast} from '../../ui';
import {generateMaterial, type GenerateRequest} from './materialsApi';
import {materialTypeOf} from './materialModel';
import {MaterialPrintHost} from './printMaterial';

export interface MaterialJob {
  id: string;
  notebookId: string;
  type: ArtifactType;
  status: 'generating' | 'error';
  request: GenerateRequest;
}

interface MaterialsJobsApi {
  jobs: MaterialJob[];
  /** Starts a background generation; it keeps running if the sheet is closed. */
  start: (notebookId: string, request: GenerateRequest) => string;
  retry: (jobId: string) => void;
  dismiss: (jobId: string) => void;
}

const JobsContext = createContext<MaterialsJobsApi | null>(null);

export function useMaterialJobs(): MaterialsJobsApi {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useMaterialJobs must be used inside <MaterialsJobsProvider>');
  return ctx;
}

/**
 * Holds in-flight material generations in memory (never persisted), so closing
 * the create sheet or leaving the section does not cancel them. On success the
 * artifact is added to its notebook; the viewer opens when the person is still
 * in that notebook's Materiales, otherwise a toast offers to open it.
 */
export function MaterialsJobsProvider({children}: {children: ReactNode}) {
  const {handleAddArtifact, activeNotebook, route} = useAppState();
  const navigate = useNavigate();
  const toast = useToast();
  const [jobs, setJobs] = useState<MaterialJob[]>([]);

  // Async completions must see the latest handlers and location, not the render that started them.
  const latest = useRef({handleAddArtifact, activeNotebook, route, navigate, toast});
  latest.current = {handleAddArtifact, activeNotebook, route, navigate, toast};
  const counter = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback((job: MaterialJob) => {
    generateMaterial(job.request)
      .then((artifact) => {
        if (!mounted.current) return;
        const cur = latest.current;
        // The handlers act on the active notebook: never write into another one.
        if (cur.activeNotebook?.id !== job.notebookId) {
          setJobs((prev) => prev.map((j) => (j.id === job.id ? {...j, status: 'error'} : j)));
          return;
        }
        cur.handleAddArtifact(artifact);
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        const inMaterials =
          cur.route.kind === 'workspace' &&
          cur.route.segment === 'ARTEFACTOS' &&
          cur.route.notebookId === job.notebookId;
        if (inMaterials) {
          cur.navigate(paths.artifact(job.notebookId, artifact.id), {state: {fromMaterials: true}});
        } else {
          cur.toast.show({
            message: `${materialTypeOf(job.type).label} listo`,
            variant: 'success',
            action: {
              label: 'Abrir',
              onAction: () => latest.current.navigate(paths.artifact(job.notebookId, artifact.id)),
            },
          });
        }
      })
      .catch(() => {
        if (!mounted.current) return;
        setJobs((prev) => prev.map((j) => (j.id === job.id ? {...j, status: 'error'} : j)));
      });
  }, []);

  const start = useCallback(
    (notebookId: string, request: GenerateRequest) => {
      const job: MaterialJob = {
        id: `job-${Date.now()}-${counter.current++}`,
        notebookId,
        type: request.type,
        status: 'generating',
        request,
      };
      setJobs((prev) => [job, ...prev]);
      run(job);
      return job.id;
    },
    [run],
  );

  const retry = useCallback(
    (jobId: string) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job || job.status !== 'error') return;
      setJobs((prev) => prev.map((j) => (j.id === jobId ? {...j, status: 'generating'} : j)));
      run({...job, status: 'generating'});
    },
    [jobs, run],
  );

  const dismiss = useCallback((jobId: string) => setJobs((prev) => prev.filter((j) => j.id !== jobId)), []);

  const api = useMemo(() => ({jobs, start, retry, dismiss}), [jobs, start, retry, dismiss]);
  return (
    <JobsContext.Provider value={api}>
      {children}
      <MaterialPrintHost />
      <ViewerHistoryBridge />
    </JobsContext.Provider>
  );
}

/**
 * Deep links to a material have no gallery entry behind them. Replace that
 * entry with the gallery, then push the viewer so browser Back returns to
 * Materiales. Opens that already carry `fromMaterials` are left alone.
 */
function ViewerHistoryBridge() {
  const {route} = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const seeding = useRef(false);

  useEffect(() => {
    if (route.kind !== 'workspace' || !route.artifactId) return;
    const state = location.state as {fromMaterials?: boolean} | null;
    if (state?.fromMaterials) {
      seeding.current = false;
      return;
    }
    if (seeding.current) return;
    seeding.current = true;
    const notebookId = route.notebookId;
    const artifactId = route.artifactId;
    void (async () => {
      await navigate(paths.notebookSegment(notebookId, 'ARTEFACTOS'), {replace: true});
      await navigate(paths.artifact(notebookId, artifactId), {state: {fromMaterials: true}});
      seeding.current = false;
    })();
  }, [route, location.state, navigate]);

  return null;
}
