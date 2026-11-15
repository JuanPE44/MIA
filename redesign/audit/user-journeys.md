# User Journeys

Single persona: the student (default "Juan"). There is no admin/teacher/other role in the product (see `product-map.md` §2).
Legend: **[OBS]** observed in browser · **[CODE]** read in source · **[INF]** inferred. AI steps observed with offline fallback only (no API key).
"Friction" lists observed facts, not solutions.

## J1 — Enter the app
1. Open `/` → Login with greeting "¡Bienvenido de nuevo Juan!", theme toggle, "Empezar" [OBS].
2. Click "Empezar" → 250 ms loading → Explorer [OBS/CODE].
- Reload always returns to Login; data persists in localStorage [CODE].
- Friction: no credentials, no choice of user type (`nuevo` unreachable) [CODE]; login screen offers no other action.

## J2 — Browse and organize notebooks
1. Explorer shows header ("EXPLORADOR DE ESTUDIO · Perfil Frecuente (Modelado)"), search, totals ("2 carpetas · 1 cuaderno (3 fuentes totales)"), folder banners with their notebooks, loose notebooks section [OBS].
2. Search by name filters folders/notebooks [CODE, input observed].
3. Folder actions: "Agregar Cuaderno", delete folder (notebooks become loose) [OBS + CODE].
4. Right-click notebook → "Abrir Cuaderno (4 Secciones)", move to folder A/B, "Sacar de carpeta", "Eliminar Cuaderno" [OBS].
5. "+ Nueva Carpeta": name, icon (12 emojis), optional cover [OBS modal + CODE].
- Friction: moving a notebook is only via right-click / "more" button; the header text itself instructs "clic derecho" [OBS]. An empty folder shows "Crear Primer Cuaderno en esta Carpeta" [OBS].

## J3 — Create a notebook
1. "+ Nuevo Cuaderno" (or folder "Agregar Cuaderno") → modal: title, subject, folder select (default "Dejar como Cuaderno suelto"), description, icon (12 emojis) [OBS].
2. "Crear Cuaderno" → opens the new notebook directly in CHAT with an empty "Chat 1" thread [CODE].
- Notebook starts with 0 sources, 0 artifacts; chat gives no grounding until sources are added [INF].

## J4 — Add and understand sources
1. Open notebook → FUENTES (or "+ Añadir Fuentes" in banner) [OBS].
2. Add via "Cargar de Galería / Fotos" or "Manual / Enlace" → modal with 3 types: "Archivo / Galería", "Enlace Web", "Pegar Texto"; fields title, text/URL; "Guardar Fuente" [OBS].
3. A toast "🧠 La IA está procesando y analizando…" appears; source shows analyzing state, then processed [CODE].
4. "Análisis IA" on a source opens modal "ANÁLISIS Y PROCESAMIENTO POR IA" with "Preguntar en Chat" / "Cerrar" [OBS].
5. Notebook analysis panel: main topic, subtopics, relevant concepts, authors, structure, critical evaluation points [OBS].
6. Tick/untick sources (checkboxes, "Tildar todas / Destildar todas") to control chat grounding [OBS].
7. Next actions: "Crear resumen de texto", "Crear otro artefacto" [OBS].
- Not verified: actual file upload/extraction, drag-and-drop, failure of extraction.

## J5 — Ask questions about the material
1. CHAT tab: banner shows thread chips, "3 fuentes", "+ Iniciar chat" [OBS].
2. Type question → "Enviar pregunta" (Enter also sends [OBS hint text]) → assistant answer with source chips and "Archivo / Origen citado" [OBS].
3. Per message: 👍, 👎, "Mejorar" (comment) [OBS buttons]; citation chip → chunk inspector [CODE].
4. Rename thread (pencil), delete thread ("×"), new thread [OBS].
5. "Google" button → Search agent (J9) [OBS].
6. Reply may suggest creating an artifact → jump to ARTEFACTOS [CODE].
- Friction: literal `**…**` shown in an answer [OBS]; label "Salir" used for three different actions (logout, leave chat ×2) [OBS]; "+ Iniciar chat" duplicated [OBS].

## J6 — Generate a study artifact
1. ARTEFACTOS → click a type (Resumen, Quiz, Cards, Guía, Examen, Audio, Infografía, Slides) [OBS].
2. Config panel: quality, format, length, color for author highlight, toggles, "Editar fuentes a utilizar" [OBS].
3. Primary button ("Elaborar Cuestionario Activo" for Quiz) → generating → new artifact appears at top of list ("Evaluación Activa: …") and the viewer opens automatically [OBS].
4. Entry points from other views: FUENTES CTAs, chat suggestion [CODE].
- Fallback content (no key) was generated instead of an error [OBS].

## J7 — Consume / improve an artifact
1. Artifact card → "Abrir Documento / PDF" or "Abrir PDF con el resumen" [OBS].
2. Viewer: "Vista Hoja PDF" vs "Modo Interactivo", zoom −/+, "Imprimir / PDF", "Copiar texto del resumen", "Mejorar", "Cerrar visor" [OBS].
3. Type-specific interaction: quiz results, flashcard flip/hint, podcast playback, infographic pillars/highlight stat [CODE; not exercised].
4. "Mejorar" → feedback prompt → refine via API [CODE].
5. Delete via "Eliminar artefacto" [OBS button].

## J8 — Study session (Pomodoro / Focus mode)
1. ESTUDIO → tab "Pomodoro (Focus mode)" → config (study 20/25/30, long break 15/20/25/30, short break fixed 5) → "Iniciar ciclo pomodoro" [OBS].
2. Cycle screen: "SESIÓN DE ESTUDIO 1 DE 4 (25 MIN)", timer 25:00, "Iniciar Concentración", reset, "A MODO DE PRUEBA" (+1 min, +10 min, "Fin Etapa (Prueba)", "1s = 1m"), session log (4 study + 3 breaks), micro-question with "Revelar Micro-Respuesta", "TU RENDIMIENTO HOY" tiles [OBS].
3. "Iniciar Concentración" only **starts the timer** (button becomes "Pausar Etapa"; navbar and tabs stay visible) [OBS, `ux-80-focus-after-start.png`]. Focus mode is a **separate** "Focus mode" button at the bottom of the cycle screen with the hint "Haz clic en Focus mode para bloquear distracciones externas" [OBS]. Focus mode: navbar/banner hidden, fullscreen + keyboard lock requested, tab-switch → warning + beep + counter [CODE; **activation not observed**]. *(Corrected on UX audit: the first version of this journey wrongly attached Focus mode to "Iniciar Concentración".)*
4. Stage completion updates stats (minutes, sessions, XP) and plays alarm [CODE].
- Friction: test-mode controls are visible in the production screen [OBS]; the tab label combines "Pomodoro" and "Focus mode" while the buttons say "Iniciar ciclo pomodoro", then "Iniciar Concentración", and Focus mode is a third, separate button [OBS].

## J9 — Practice recall and flashcards
- Active Recall: "Generar Desafío…" → question → textarea → "Comparar con Respuesta Canónica" / "Cambiar Pregunta" [OBS].
- Flashcards: card with question; "Anterior / Siguiente"; flip; "Marcar como Dominada (+15 XP)" [OBS].
- Weekly progress: chart, goal select, "+15m" / "+25m Pomodoro" manual logging [OBS].

## J10 — Search the web (Google agent)
1. Open from navbar or chat "Google" [OBS].
2. Choose mode: "Eventos Actuales", "Citar Noticias Recientes", "Verificar Información"; or tap a suggested prompt [OBS].
3. Ask → result with "Copiar texto", "Abrir Fuente", "Al Cuaderno" (saves as source) [OBS controls].
- Escape did not close the agent [OBS].

## J11 — Get support / make a reservation
1. Navbar "Soporte IA" or floating `?` [OBS].
2. Panel with quick chips: "📅 Reservar tutoría 1 a 1", "🏢 Reservar sala de estudio", "🔧 Problema al cargar un PDF", "⏱️ ¿Cómo funciona el Focus mode?" [OBS].
3. Conversation → may return a reservation card (id, type, subject, date/time, host/room) [CODE].
- Reservations: no persistence or external booking found in the files read [INF — verify before relying on it].

## J12 — Manage profile / reset data
1. Bottom-left "PERFIL" → modal: tab "Plan Actual & Estado de Cuenta" (plan, account summary) / "Datos Académicos" (form) [OBS].
2. "Restablecer datos de prueba" restores seed folders, notebooks, stats, profile [CODE]; "Entendido" closes [OBS].
- Friction: Escape does not close [OBS].

## J13 — Switch theme / leave
- "Blanco"/"Negro" switch available on Login and navbar; persisted [OBS + CODE].
- "Salir" (navbar) → Login [CODE].

## Observed cross-journey notes (facts)
- Same stats (streak, minutes) rendered in navbar and bottom bar and in Study tiles [OBS].
- Mobile (390 px): layout overflows horizontally (521 px) and the segment tabs clip [OBS].
- Journeys J6–J11 depend on the server fallback when no key is configured; behavior with a real key is unverified.
