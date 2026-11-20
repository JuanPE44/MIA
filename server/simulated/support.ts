import {norm} from './text.js';

export interface SupportContext {
  username: string;
  currentNotebook?: {title?: string; subject?: string} | null;
  currentView?: string;
  stats?: {focusMinutesToday?: number};
}

export interface SupportReply {
  reply: string;
  reservation: Record<string, string> | null;
}

const has = (m: string, ...words: string[]): boolean => words.some((w) => new RegExp(`\\b${w}`).test(m));

/** Rule-based answers about how the app works (sources, chat, materials, study mode, plans). */
export function supportReply(userMsg: string, ctx: SupportContext): SupportReply {
  const m = norm(userMsg);
  const {username, currentNotebook, stats} = ctx;
  const where = currentNotebook?.title ? `en el cuaderno «${currentNotebook.title}»` : 'en tu biblioteca';
  let reply = '';
  let reservation: SupportReply['reservation'] = null;

  if (has(m, 'reserv', 'tutor', 'sala')) {
    if (has(m, 'confirm', 'si\\b', 'manana', 'jueves', 'lunes', 'martes', 'miercoles', 'viernes', '\\d{1,2}:\\d{2}')) {
      reservation = {
        id: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
        type: has(m, 'sala') ? 'Sala de Estudio Silenciosa' : 'Tutoría Personalizada',
        subject: currentNotebook?.subject || currentNotebook?.title || 'Estudio general',
        dateTime: 'Próxima jornada disponible (confirmada)',
        hostOrRoom: has(m, 'sala') ? 'Cubículo de Enfoque 4' : 'Prof. Dr. Marcelo Silva',
        student: username,
      };
      reply = `¡Listo, ${username}! Tu reserva quedó registrada. Aquí tienes el detalle:`;
    } else {
      reply = `Con gusto te ayudo con la reserva, ${username}. Tengo estas opciones:\n\n1. **Tutoría 1 a 1** con un mentor de ${currentNotebook?.subject || 'tu materia'}.\n2. **Sala de estudio silenciosa** (cubículo individual).\n3. **Sala grupal** para trabajar en equipo.\n\n¿Cuál prefieres y para qué día y hora?`;
    }
  } else if (has(m, 'subir', 'cargar', 'agregar', 'anadir', 'importar', 'fuente', 'pdf', 'archivo', 'imagen', 'audio', 'enlace', 'link')) {
    reply = `Para añadir material ${where}:\n\n1. Entra a la pestaña **Fuentes**.\n2. Pulsa **Agregar fuente** y elige PDF, texto, imagen, audio o enlace.\n3. Espera a que termine el análisis: verás un resumen y los conceptos clave de cada fuente.\n\nTips: los archivos pueden pesar hasta 3 MB, y solo las fuentes **activadas** se usan en el chat y en los materiales. Si un PDF es un escaneo, MIA intenta leerlo igualmente. ¿Qué tipo de archivo quieres subir?`;
  } else if (has(m, 'chat', 'pregunt', 'cita', 'citas', 'responde', 'respuesta')) {
    reply = `En la pestaña **Preguntar** puedes conversar con tus fuentes:\n\n- MIA responde solo con lo que dicen tus fuentes activas.\n- Cada respuesta incluye marcas **[1] [2]**: pulsa una para ver el fragmento exacto del que salió.\n- Con los botones de cada respuesta puedes valorarla o pedir un ajuste con **Comentar**.\n\nSi la respuesta no te convence, prueba a reformular con un término concreto de tu material.`;
  } else if (has(m, 'material', 'resumen', 'cuestionario', 'flashcard', 'tarjeta', 'guia', 'podcast', 'infograf', 'presentacion', 'examen', 'generar', 'crear')) {
    reply = `En **Materiales** puedes generar:\n\n- **Resumen**, **Guía de estudio** y **Presentación**\n- **Cuestionario** y **Modelo de examen**\n- **Flashcards**\n- **Podcast** e **Infografía**\n\nElige el tipo, ajusta calidad, extensión y formato, y pulsa generar. Después puedes abrirlo, pedir cambios con un comentario (por ejemplo "más corto" o "agrega ejemplos") o imprimirlo. ¿Cuál quieres probar?`;
  } else if (has(m, 'pomodoro', 'blindado', 'focus', 'enfoque', 'concentr', 'distra', 'temporizador', 'estudiar', 'sesion')) {
    reply = `En **Estudio** inicias una sesión de enfoque (Pomodoro):\n\n- Defines la duración y, si quieres, activas el **Modo Blindado**: si cambias de pestaña, MIA lo registra como distracción y te avisa.\n- Al terminar tienes un descanso corto con una pregunta de repaso activo.\n- El **Repaso activo** te hace una pregunta sobre tus fuentes y compara tu respuesta con la referencia.\n\nHoy llevas ${stats?.focusMinutesToday ?? 0} minutos de enfoque. ¿Quieres fijar una meta?`;
  } else if (has(m, 'plan', 'precio', 'pro\\b', 'extended', 'pago', 'suscrip', 'limite', 'cuota', 'gratis')) {
    reply = `Hay tres planes: **Gratis**, **Extended** y **Pro**. Cambian los límites de cuadernos y fuentes, la cantidad de infografías y podcasts por periodo, y el acceso a funciones como la búsqueda web.\n\nPuedes compararlos y cambiar de plan en la sección **Planes** del menú. Si llegaste a un límite, te lo indicará al intentar generar o añadir algo nuevo.`;
  } else if (has(m, 'busca', 'web', 'internet', 'noticia', 'verificar', 'google')) {
    reply = `La **búsqueda web** te permite consultar temas de actualidad, pedir noticias con citas o verificar un dato. Puedes abrirla desde el chat con el botón de búsqueda web. Los resultados se pueden guardar como una fuente de tu cuaderno para estudiarlos junto con el resto.`;
  } else if (has(m, 'error', 'problema', 'falla', 'no funciona', 'no puedo', 'no carga', 'ayuda', 'bug')) {
    reply = `Entiendo, ${username}. Vamos paso a paso:\n\n1. Recarga la página y vuelve a intentarlo.\n2. Si falla al subir un archivo, comprueba que pese menos de 3 MB y sea PDF, texto, imagen o audio.\n3. Si el chat no responde con tu material, verifica en **Fuentes** que al menos una esté activada.\n\n¿Qué mensaje o comportamiento ves exactamente? Con ese detalle puedo afinar el siguiente paso.`;
  } else if (has(m, 'hola', 'buenas', 'hey', 'que tal', 'quien eres', 'que puedes', 'que haces')) {
    reply = `¡Hola, ${username}! Soy el soporte de MIA. Puedo ayudarte a:\n\n- **Subir y organizar fuentes** (PDF, texto, imagen, audio, enlaces)\n- **Preguntar a tus fuentes** y entender las citas\n- **Generar materiales** (resúmenes, cuestionarios, flashcards, podcast…)\n- **Estudiar con enfoque** (Pomodoro, Modo Blindado, repaso activo)\n- **Reservar** tutorías o salas de estudio\n\nEstás ${where}. ¿Con qué empezamos?`;
  } else {
    reply = `Gracias por escribir, ${username}. Esto puedo resolver ahora mismo:\n\n- Cómo **subir fuentes** y qué formatos acepta\n- Cómo usar el **chat con citas**\n- Cómo **generar y ajustar materiales**\n- Cómo funciona el **Modo Blindado** y el repaso activo\n- **Planes** y límites\n- **Reservas** de tutorías y salas\n\nCuéntame qué estás intentando hacer ${where} y te guío paso a paso.`;
  }

  return {reply, reservation};
}
