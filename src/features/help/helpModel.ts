export interface HelpRequest {
  id: string;
  type: string;
  subject: string;
  dateTime: string;
  hostOrRoom: string;
}

export interface HelpMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  request?: HelpRequest | null;
}

const MESSAGES_KEY = 'mia_help_messages_v1';
const REQUESTS_KEY = 'mia_help_requests_v1';

export const REQUEST_NOTE = 'Esto todavía no reserva un lugar real.';

/** Shown instead of the service text when a request is created (nothing is booked or stored server-side). */
export const REQUEST_REPLY =
  'Preparé tu solicitud con estos datos. Queda pendiente de confirmación: por ahora no reserva un lugar real.';

export const QUICK_ACTIONS: Array<{label: string; query: string}> = [
  {label: 'Pedir tutoría', query: 'Quiero reservar una sesión de tutoría académica personalizada.'},
  {label: 'Pedir sala de estudio', query: 'Deseo reservar una sala de estudio para concentrarme mañana.'},
  {
    label: 'Problema con un PDF',
    query: 'Tengo un problema: subí un archivo PDF y quiero saber cómo verificar que se haya leído bien.',
  },
  {label: '¿Qué es el modo blindado?', query: '¿Cómo funciona el modo blindado durante una sesión de estudio?'},
];

export const FAQ: Array<{q: string; a: string}> = [
  {
    q: '¿Dónde se guardan mis datos?',
    a: 'Solo en este navegador. Si borras los datos del sitio o cambias de navegador, no se recuperan.',
  },
  {
    q: '¿Qué significa "Simulado"?',
    a: 'Que la respuesta es de ejemplo: la IA todavía no está conectada.',
  },
  {
    q: '¿Qué hace el modo blindado?',
    a: 'Durante una sesión de estudio te avisa y cuenta cada vez que sales de la pestaña. Puedes salir cuando quieras.',
  },
  {
    q: '¿Mis solicitudes de tutoría o sala son reservas reales?',
    a: 'No. Quedan como solicitudes enviadas, pendientes de confirmación.',
  },
];

function load<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session-only convenience: ignore storage failures.
  }
}

export const loadMessages = () => load<HelpMessage>(MESSAGES_KEY);
export const saveMessages = (messages: HelpMessage[]) => save(MESSAGES_KEY, messages);
export const loadRequests = () => load<HelpRequest>(REQUESTS_KEY);
export const saveRequests = (requests: HelpRequest[]) => save(REQUESTS_KEY, requests);

export function requestSummary(r: HelpRequest): string {
  return [
    'Solicitud enviada · pendiente de confirmación',
    `Tipo: ${r.type}`,
    `Materia: ${r.subject}`,
    `Fecha y hora: ${r.dateTime}`,
    `Lugar o tutor: ${r.hostOrRoom}`,
    REQUEST_NOTE,
  ].join('\n');
}
