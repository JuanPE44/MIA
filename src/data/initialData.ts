import { Notebook, Folder, StudentProfile, UserStudyStats } from '../types';
import bannerEmprendimiento from '../assets/images/folder_emprendimiento_banner_1791726610840.jpg';
import bannerCuatrimestre from '../assets/images/folder_cuatrimestre_banner_1791726628989.jpg';

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  id: 'student-1',
  name: 'Juan',
  degree: 'Licenciatura en Administración y Emprendimiento',
  university: 'Facultad de Ciencias Económicas',
  academicTerm: '2º Cuatrimestre 2026',
  avatarSeed: 'Juan'
};

export const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'folder-emp',
    name: 'Emprendimiento & Negocios',
    color: 'indigo',
    icon: 'briefcase',
    createdAt: '2026-09-01',
    coverImage: bannerEmprendimiento
  },
  {
    id: 'folder-cuatrimestre',
    name: '1er Cuatrimestre 2026',
    color: 'emerald',
    icon: 'book',
    createdAt: '2026-09-10',
    coverImage: bannerCuatrimestre
  }
];

export const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-lean-startup',
    folderId: 'folder-emp',
    title: 'Emprendedorismo: Metodología Lean Startup y Canvas',
    description: 'Material nuclear sobre experimentación ágil de Eric Ries y los 9 bloques del Business Model Canvas de Alexander Osterwalder.',
    subject: 'Economía & Negocios',
    category: 'emprendimiento',
    color: 'indigo',
    icon: 'rocket',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-05',
    sources: [
      {
        id: 'src-ries-lean',
        type: 'pdf',
        title: 'Eric Ries - El Método Lean Startup (Capítulos 1 al 4)',
        fileName: 'Ries_Lean_Startup_Extracto.pdf',
        fileSize: '2.4 MB',
        uploadDate: '2026-09-28',
        wordCount: 3450,
        isProcessed: true,
        analysisSummary: 'Análisis del método Lean Startup de Eric Ries centrado en el circuito Construir-Medir-Aprender, el MVP y la toma de decisiones entre perseverar o pivotar con base en aprendizaje validado.',
        processedAuthors: ['Eric Ries', 'Steve Blank', 'Alexander Osterwalder'],
        processedConcepts: [
          { term: 'Construir-Medir-Aprender', definition: 'Bucle iterativo de retroalimentación para minimizar el tiempo de experimentación.', importance: 'clave' },
          { term: 'Producto Mínimo Viable (MVP)', definition: 'Versión del producto que permite recolectar la máxima cantidad de aprendizaje validado con el menor esfuerzo.', importance: 'clave' },
          { term: 'Pivote', definition: 'Corrección estructurada para probar una nueva hipótesis fundamental sin cambiar la visión general.', importance: 'clave' }
        ],
        content: `El método Lean Startup, popularizado por Eric Ries, revoluciona la creación de empresas aplicando experimentación científica en lugar de planes de negocio rígidos tradicionales.
Su principio angular es el circuito Construir-Medir-Aprender:
1. Construir: Transformar ideas e hipótesis en un Producto Mínimo Viable (MVP).
2. Medir: Evaluar empíricamente con clientes reales cómo reaccionan al producto, usando métricas accionables en lugar de métricas vanidosas.
3. Aprender: Determinar a partir del aprendizaje validado si se debe perseverar en la misma dirección o pivotar hacia una nueva hipótesis fundamental sobre el motor de crecimiento o el modelo de valor.

Un Producto Mínimo Viable (MVP) no es un producto deficiente o incompleto; es la versión que permite recolectar la máxima cantidad de aprendizaje validado sobre los clientes con el menor esfuerzo posible.
Autores clave citados: Eric Ries (padre de la metodología Lean Startup), Steve Blank (Customer Development) y Alexander Osterwalder.`
      },
      {
        id: 'src-osterwalder-canvas',
        type: 'text',
        title: 'Alexander Osterwalder - Business Model Canvas (9 Bloques)',
        uploadDate: '2026-10-01',
        wordCount: 1820,
        isProcessed: true,
        analysisSummary: 'Estructura integral del Business Model Canvas desarrollada por Alexander Osterwalder y Yves Pigneur, agrupando los 9 módulos en deseabilidad, factibilidad y viabilidad financiera.',
        processedAuthors: ['Alexander Osterwalder', 'Yves Pigneur'],
        processedConcepts: [
          { term: 'Business Model Canvas', definition: 'Herramienta visual de gestión estratégica para describir, diseñar y pivotar modelos de negocio en una sola lámina.', importance: 'clave' },
          { term: 'Propuesta de Valor', definition: 'Paquete de productos y servicios que crean valor para un segmento de mercado específico.', importance: 'alta' }
        ],
        content: `El Business Model Canvas de Alexander Osterwalder y Yves Pigneur estructura la lógica sobre cómo una organización crea, entrega y captura valor en una única lámina visual compuesta por nueve módulos fundamentales:

1. Segmentos de Mercado: Grupos de personas o entidades que la empresa busca servir.
2. Propuesta de Valor: Conjunto de productos y servicios que generan valor para un segmento específico resolviendo un problema o satisfaciendo una necesidad.
3. Canales: Puntos de contacto mediante los cuales la empresa comunica y entrega su propuesta de valor.
4. Relaciones con Clientes: Tipos de vínculos establecidos con cada segmento de mercado (asistencia personal, autoservicio, comunidades).
5. Fuentes de Ingresos: El flujo de caja generado por cada segmento de clientes.
6. Recursos Clave: Activos imprescindibles para hacer funcionar el modelo (físicos, intelectuales, humanos, financieros).
7. Actividades Clave: Las acciones más importantes que debe emprender la empresa para que su modelo opere con éxito.
8. Asociaciones Clave: La red de proveedores y socios que contribuyen al funcionamiento del modelo y reducen riesgos.
9. Estructura de Costos: Todos los costos en los que se incurre para poner en marcha y mantener el modelo.

El lienzo divide de manera lógica la Deseabilidad (lado derecho: clientes y propuesta), la Factibilidad (lado izquierdo: actividades y recursos) y la Viabilidad Financiera (base: costos e ingresos).`
      },
      {
        id: 'src-link-mvp-cases',
        type: 'link',
        title: 'Casos Prácticos de MVP: Dropbox, Zappos y Buffer',
        sourceUrl: 'https://hbr.org/case-studies/lean-startup-mvp',
        uploadDate: '2026-10-02',
        wordCount: 950,
        isProcessed: true,
        analysisSummary: 'Estudio de 3 casos empíricos de éxito en la implementación de MVP: video explicativo de Dropbox por Drew Houston, prueba de fotos de calzado de Zappos por Nick Swinmurn y validación de precios con landing page de Buffer por Joel Gascoigne.',
        processedAuthors: ['Drew Houston (Dropbox)', 'Nick Swinmurn (Zappos)', 'Joel Gascoigne (Buffer)'],
        processedConcepts: [
          { term: 'MVP de Video (Dropbox)', definition: 'Demostración visual del funcionamiento del software que validó demanda pasando de 5.000 a 75.000 suscripciones en lista de espera.', importance: 'alta' },
          { term: 'MVP Manual / Mago de Oz (Zappos)', definition: 'Comprobación de la disposición a comprar zapatos online sin inventario ni almacenes previos.', importance: 'alta' }
        ],
        content: `Análisis de casos reales de validación con MVP:
- Dropbox: Drew Houston validó la demanda sin escribir el software de sincronización complejo; creó un video explicativo de 3 minutos demostrando cómo funcionaría. La lista de espera pasó de 5.000 a 75.000 personas en una sola noche.
- Zappos: Nick Swinmurn tomó fotos de zapatos en tiendas físicas locales y las publicó online; cuando alguien compraba, iba a la tienda y los despachaba por correo. Validó si la gente estaba dispuesta a comprar calzado sin probárselo antes de invertir en bodegas y stock.
- Buffer: Joel Gascoigne creó una landing page con precios antes de programar la herramienta. Los botones llevaban a un formulario "Aún no estamos listos, déjanos tu email". Validó la disposición a pagar.`
      }
    ],
    analysis: {
      mainTopic: 'Metodología Lean Startup y Diseño de Modelos de Negocio Canvas',
      subtopics: [
        'Circuito Construir-Medir-Aprender y aprendizaje validado',
        'Definición y tipologías de Producto Mínimo Viable (MVP)',
        'Concepto y criterios para ejecutar un Pivote estratégico',
        'Los 9 bloques del Business Model Canvas (Deseabilidad, Factibilidad, Viabilidad)',
        'Métricas accionables vs. métricas vanidosas en nuevos emprendimientos',
        'Casos reales de validación empírica (Dropbox, Zappos, Buffer)'
      ],
      keyConcepts: [
        {
          term: 'Circuito Construir-Medir-Aprender',
          definition: 'Bucle iterativo de retroalimentación orientado a minimizar el tiempo total de experimentación con clientes.',
          importance: 'clave'
        },
        {
          term: 'Producto Mínimo Viable (MVP)',
          definition: 'Versión del producto que permite recolectar la máxima cantidad de aprendizaje validado con el menor esfuerzo.',
          importance: 'clave'
        },
        {
          term: 'Pivote',
          definition: 'Corrección de rumbo estructurada para poner a prueba una nueva hipótesis fundamental sobre el producto o modelo.',
          importance: 'alta'
        },
        {
          term: 'Propuesta de Valor',
          definition: 'Solución distintiva a un dolor o necesidad de un segmento de mercado que diferencia a la empresa de alternativas.',
          importance: 'clave'
        },
        {
          term: 'Métricas Accionables',
          definition: 'Indicadores que reflejan causas y efectos reales del comportamiento del cliente (conversión, retención) frente a likes o visitas superficiales.',
          importance: 'alta'
        }
      ],
      structure: [
        'Fase 1: Diagnóstico de la incertidumbre en startups (Ries)',
        'Fase 2: Arquitectura del modelo de negocio en 9 bloques (Osterwalder)',
        'Fase 3: Prototipado y validación empírica mediante MVP (Casos prácticos)',
        'Fase 4: Toma de decisión: Perseverar vs. Pivotar'
      ],
      mentionedAuthors: [
        'Eric Ries (autor de The Lean Startup)',
        'Alexander Osterwalder (co-creador del Business Model Canvas)',
        'Yves Pigneur (co-autor del Modelo Canvas)',
        'Steve Blank (fundador de Customer Development)',
        'Drew Houston (fundador de Dropbox)',
        'Nick Swinmurn (fundador de Zappos)',
        'Joel Gascoigne (fundador de Buffer)'
      ],
      importantDefinitions: [
        {
          term: 'Aprendizaje Validado',
          explanation: 'Proceso de demostrar empíricamente que un equipo ha descubierto verdades valiosas sobre las perspectivas presentes y futuras del negocio.'
        },
        {
          term: 'Deseabilidad, Factibilidad y Viabilidad',
          explanation: 'Las tres dimensiones que integran el Canvas: ¿lo quieren los clientes? ¿lo podemos construir? ¿es rentable?'
        }
      ],
      conceptRelationships: [
        'El Business Model Canvas formula las hipótesis que el circuito Construir-Medir-Aprender de Lean Startup somete a prueba empírica.',
        'El MVP actúa como el vehículo experimental que conecta la Propuesta de Valor con los Segmentos de Clientes.',
        'El aprendizaje validado resultante define la decisión entre perseverar o pivotar en los bloques del Canvas.'
      ],
      evaluationPoints: [
        'Diferenciar con precisión entre un plan de negocios tradicional (orientado a ejecución) y Lean Startup (orientado a búsqueda y aprendizaje).',
        'Definir los 9 bloques del Canvas y su agrupamiento en Deseabilidad, Factibilidad y Viabilidad.',
        'Explicar qué es un pivote y dar ejemplos concretos a partir de los casos analizados (Dropbox, Zappos).',
        'Analizar la diferencia entre métricas vanidosas y métricas accionables en una pregunta de examen.'
      ],
      analyzedAt: '2026-10-02 11:20'
    },
    artifacts: [
      {
        id: 'art-resumen-1',
        type: 'resumen',
        title: 'Resumen Ejecutivo: Metodología Lean Startup y Canvas',
        createdAt: '2026-10-02 11:25',
        personalization: {
          quality: 'detallista',
          format: 'jerarquico',
          length: 'intermedio',
          citeSources: true,
          keepTitles: true,
          highlightAuthors: true,
          addExamples: true,
          generateGraphics: true,
          generateIndex: true
        },
        citations: [
          'Fuente 1: Eric Ries - El Método Lean Startup (Capítulos 1 al 4)',
          'Fuente 2: Alexander Osterwalder - Business Model Canvas (9 Bloques)',
          'Fuente 3: Casos Prácticos de MVP: Dropbox, Zappos y Buffer'
        ],
        summaryText: `## Resumen Estructurado: Metodología Lean Startup y Canvas

### Índice de Contenidos
1. [El Paradigma Lean Startup y la Incertidumbre Extrema](#paradigma)
2. [El Bucle Construir-Medir-Aprender](#bucle)
3. [El Producto Mínimo Viable (MVP) y Casos Clave](#mvp)
4. [La Arquitectura en 9 Bloques de Osterwalder](#canvas)
5. [Ejes para Evaluación Académica](#evaluacion)

---

### <a id="paradigma"></a>1. El Paradigma Lean Startup y la Incertidumbre Extrema
De acuerdo con **Eric Ries** en *El Método Lean Startup* [Fuente 1], una startup es una institución humana diseñada para crear un nuevo producto o servicio bajo condiciones de **incertidumbre extrema**. Los planes de negocio tradicionales fallan en este contexto porque asumen certezas y pronósticos a 5 años que no se corresponden con la realidad del mercado.

### <a id="bucle"></a>2. El Bucle Construir-Medir-Aprender
El núcleo de la metodología reside en acelerar el circuito de retroalimentación:
- **Construir:** Traducir ideas en un prototipo experimental (MVP).
- **Medir:** Evaluar el comportamiento real con métricas accionables (retención, recomendación) descartando métricas vanidosas [Fuente 1].
- **Aprender:** Generar *aprendizaje validado* para decidir entre perseverar o pivotar.

> **Definición de Pivote:** Corrección de rumbo estructurada diseñada para probar una nueva hipótesis fundamental sobre el producto, el modelo de negocio o el motor de crecimiento [Fuente 1].

### <a id="mvp"></a>3. El Producto Mínimo Viable (MVP) y Casos Clave
El MVP es la versión más simple que permite recolectar la máxima cantidad de aprendizaje validado con el menor esfuerzo.
- **Caso Dropbox (Drew Houston):** Un simple video explicativo de 3 minutos validó la demanda disparando la lista de espera de 5.000 a 75.000 personas antes de codificar la infraestructura [Fuente 3].
- **Caso Zappos (Nick Swinmurn):** Fotografió calzado en comercios locales y despachó personalmente para comprobar la disposición real de compra online [Fuente 3].

### <a id="canvas"></a>4. La Arquitectura en 9 Bloques de Osterwalder
El lienzo de **Alexander Osterwalder** e **Yves Pigneur** [Fuente 2] condensa el modelo de negocio en 3 grandes áreas:
1. **Deseabilidad (Clientes):** Segmentos, Propuesta de Valor, Canales y Relaciones.
2. **Factibilidad (Operaciones):** Recursos Clave, Actividades Clave y Asociaciones Clave.
3. **Viabilidad Financiera (Económica):** Estructura de Costos y Fuentes de Ingresos.

### <a id="evaluacion"></a>5. Ejes para Evaluación Académica
- *Pregunta Típica de Examen:* ¿Por qué el MVP de Dropbox no fue un software beta funcional sino un video? *(Respuesta: Porque el objetivo era validar la hipótesis de valor y el interés del cliente, no probar la estabilidad técnica).*
- *Criterio Evaluativo:* Dominio de la conexión entre hipótesis en el Canvas y validación empírica en el bucle Lean.`
      },
      {
        id: 'art-cuestionario-1',
        type: 'cuestionario',
        title: 'Cuestionario de Evaluación Activa: Lean & Canvas',
        createdAt: '2026-10-02 11:30',
        personalization: {
          quality: 'alto',
          format: 'punteo',
          length: 'intermedio',
          citeSources: true,
          keepTitles: true,
          highlightAuthors: true,
          addExamples: false,
          generateGraphics: false,
          generateIndex: false
        },
        citations: ['Fuente 1: Eric Ries', 'Fuente 2: Osterwalder Canvas', 'Fuente 3: Casos de MVP'],
        summaryText: 'Cuestionario interactivo con 4 preguntas clave de opción múltiple diseñadas a partir de las fuentes para preparar exámenes parciales y finales.',
        structuredData: [
          {
            question: 'Según Eric Ries, ¿cuál es el objetivo primordial de un Producto Mínimo Viable (MVP)?',
            options: [
              'Generar la mayor cantidad de ventas inmediatas para financiar la empresa',
              'Recolectar la máxima cantidad de aprendizaje validado sobre los clientes con el menor esfuerzo',
              'Lanzar un producto completo con todas las funciones planeadas por los fundadores',
              'Reemplazar por completo la necesidad de medir métricas de retención'
            ],
            correctAnswer: 'Recolectar la máxima cantidad de aprendizaje validado sobre los clientes con el menor esfuerzo',
            explanation: 'En las fuentes, Eric Ries define al MVP no como un producto deficiente, sino como la herramienta experimental más económica para validar hipótesis con clientes reales.',
            sourceCitation: 'Fuente 1: Eric Ries - El Método Lean Startup'
          },
          {
            question: '¿Qué tres grandes dimensiones integra el Business Model Canvas de Alexander Osterwalder?',
            options: [
              'Marketing, Finanzas y Recursos Humanos',
              'Planificación, Presupuesto y Auditoría',
              'Deseabilidad (clientes), Factibilidad (operaciones) y Viabilidad Financiera (costos e ingresos)',
              'Diseño, Fabricación y Distribución internacional'
            ],
            correctAnswer: 'Deseabilidad (clientes), Factibilidad (operaciones) y Viabilidad Financiera (costos e ingresos)',
            explanation: 'El Canvas divide la lámina visual en Deseabilidad (lado derecho), Factibilidad (lado izquierdo) y Viabilidad económica (la base de costos e ingresos).',
            sourceCitation: 'Fuente 2: Alexander Osterwalder - Business Model Canvas'
          },
          {
            question: '¿Cómo validó Nick Swinmurn la hipótesis principal de Zappos según los casos de estudio?',
            options: [
              'Comprando un almacén con miles de pares de zapatos',
              'Contratando una agencia de publicidad digital en televisión',
              'Tomando fotos en tiendas físicas y despachando manualmente tras cada compra online',
              'Desarrollando una inteligencia artificial de recomendación de talles'
            ],
            correctAnswer: 'Tomando fotos en tiendas físicas y despachando manualmente tras cada compra online',
            explanation: 'Swinmurn no invirtió en inventario ni depósitos: probó si la gente pagaría por calzado en internet antes de estructurar la empresa.',
            sourceCitation: 'Fuente 3: Casos Prácticos de MVP'
          },
          {
            question: '¿Qué diferencia a una métrica accionable de una métrica vanidosa?',
            options: [
              'Las métricas accionables reflejan causas y efectos reales de retención/conversión; las vanidosas sólo muestran números inflados que no prueban valor',
              'Las métricas vanidosas son siempre más precisas matemáticamente',
              'Las métricas accionables no requieren encuestar a ningún usuario',
              'No existe diferencia conceptual según la metodología Lean'
            ],
            correctAnswer: 'Las métricas accionables reflejan causas y efectos reales de retención/conversión; las vanidosas sólo muestran números inflados que no prueban valor',
            explanation: 'Ries enfatiza que los "likes" y visitas superficiales engañan al equipo, mientras que las métricas accionables vinculan acciones con resultados de negocio.',
            sourceCitation: 'Fuente 1: Eric Ries - El Método Lean Startup'
          }
        ]
      },
      {
        id: 'art-flashcards-1',
        type: 'flashcards',
        title: 'Mazo de Flashcards: Conceptos Clave Lean & Canvas',
        createdAt: '2026-10-02 11:35',
        personalization: {
          quality: 'alto',
          format: 'punteo',
          length: 'conciso',
          citeSources: true,
          keepTitles: true,
          highlightAuthors: true,
          addExamples: true,
          generateGraphics: false,
          generateIndex: false
        },
        citations: ['Fuente 1: Eric Ries', 'Fuente 2: Osterwalder Canvas'],
        summaryText: 'Mazo de tarjetas de memorización activa espaciada para afianzar los conceptos indispensables.',
        structuredData: [
          {
            id: 'fc-1',
            question: '¿Qué es el circuito Construir-Medir-Aprender?',
            answer: 'El bucle de retroalimentación iterativo propuesto por Eric Ries para convertir ideas en MVP, medir la respuesta real del cliente y aprender si perseverar o pivotar.',
            hint: 'Es el corazón de Lean Startup.',
            category: 'Metodología',
            mastered: true
          },
          {
            id: 'fc-2',
            question: '¿Qué define a un Producto Mínimo Viable (MVP)?',
            answer: 'La versión que permite recolectar la máxima cantidad de aprendizaje validado sobre los clientes con el menor esfuerzo posible.',
            hint: 'No es un producto incompleto, es un experimento.',
            category: 'Definición Clave',
            mastered: true
          },
          {
            id: 'fc-3',
            question: '¿Qué es un pivote estratégico?',
            answer: 'Una corrección de rumbo estructurada diseñada para probar una nueva hipótesis fundamental sobre el producto, el modelo o el motor de crecimiento.',
            hint: 'Decisión tras el aprendizaje validado.',
            category: 'Estrategia',
            mastered: false
          },
          {
            id: 'fc-4',
            question: '¿Cuáles son los 9 bloques del Canvas de Osterwalder?',
            answer: 'Segmentos de clientes, Propuesta de valor, Canales, Relaciones, Fuentes de ingresos, Recursos clave, Actividades clave, Asociaciones clave y Estructura de costos.',
            hint: 'Agrupados en Deseabilidad, Factibilidad y Viabilidad.',
            category: 'Modelo de Negocio',
            mastered: false
          }
        ]
      },
      {
        id: 'art-infografia-1',
        type: 'infografia',
        title: 'Infografía Visual: La Anatomía de la Startup Ágil',
        createdAt: '2026-10-02 11:40',
        personalization: {
          quality: 'detallista',
          format: 'jerarquico',
          length: 'intermedio',
          citeSources: true,
          keepTitles: true,
          highlightAuthors: true,
          addExamples: true,
          generateGraphics: true,
          generateIndex: false
        },
        citations: ['Fuente 1: Ries', 'Fuente 2: Osterwalder'],
        summaryText: 'Esquema gráfico estructurado en 4 pilares fundamentales para anclaje visual rápido.',
        structuredData: {
          highlightStat: {
            number: '82%',
            label: 'de proyectos con MVP reducen el desperdicio de horas de ingeniería'
          },
          pillars: [
            {
              title: '1. Hipótesis & Canvas',
              desc: 'Planteo inicial en los 9 bloques de Osterwalder identificando las hipótesis más arriesgadas de Deseabilidad y Factibilidad.',
              color: 'from-indigo-500 to-violet-600'
            },
            {
              title: '2. Prototipo MVP',
              desc: 'Diseño del experimento más rápido y económico (video de Dropbox, conserje de Zappos, landing page de Buffer).',
              color: 'from-blue-500 to-cyan-600'
            },
            {
              title: '3. Medición Accionable',
              desc: 'Registro riguroso del comportamiento real del cliente: conversión, retención y recomendación, evitando métricas vanidosas.',
              color: 'from-emerald-500 to-teal-600'
            },
            {
              title: '4. Decisión: Perseverar o Pivotar',
              desc: 'Análisis de aprendizaje validado para continuar escalando o corregir el rumbo antes de agotar la caja.',
              color: 'from-amber-500 to-orange-600'
            }
          ],
          keyTakeaways: [
            'No construyas lo que nadie quiere: valida antes de codificar.',
            'Un fracaso empírico en un experimento es éxito de aprendizaje si ahorra meses de desarrollo.',
            'El Canvas es un mapa dinámico que cambia tras cada iteración con el cliente.'
          ]
        }
      },
      {
        id: 'art-audio-1',
        type: 'audio_podcast',
        title: 'Audio-Resumen Dinámico: Diálogo de Estudio Lean Startup',
        createdAt: '2026-10-02 11:45',
        personalization: {
          quality: 'medio',
          format: 'texto',
          length: 'intermedio',
          citeSources: true,
          keepTitles: true,
          highlightAuthors: true,
          addExamples: true,
          generateGraphics: false,
          generateIndex: false
        },
        citations: ['Fuente 1: Ries', 'Fuente 2: Osterwalder'],
        summaryText: 'Guion sintetizado para consolidar conocimientos por vía auditiva durante caminatas o descansos visuales.',
        structuredData: [
          {
            speaker: 'Sofía (Host)',
            text: '¡Hola a todos! Bienvenidos a este episodio de FocusEd. Hoy tenemos en mesa un tema central de examen: Lean Startup y el Modelo Canvas. Lucas, ¿por qué es tan común que los estudiantes se confundan con el concepto de MVP?',
            timestamp: '00:00'
          },
          {
            speaker: 'Lucas (Co-host)',
            text: '¡Hola Sofía! El error número uno es creer que un MVP es una versión beta mal hecha de un software. Como explica Eric Ries en las fuentes, el MVP es el experimento más pequeño para validar una hipótesis con clientes reales.',
            timestamp: '00:30'
          },
          {
            speaker: 'Sofía (Host)',
            text: 'Exactamente. El caso de Dropbox lo demuestra perfecto: ¡Drew Houston ni siquiera programó la sincronización todavía! Un video de 3 minutos validó la demanda total.',
            timestamp: '01:05'
          },
          {
            speaker: 'Lucas (Co-host)',
            text: 'Totalmente. Y al complementarlo con los 9 bloques del Canvas de Osterwalder, sabes exactamente qué bloque estás poniendo a prueba. Una combinación imparable para el parcial.',
            timestamp: '01:40'
          }
        ]
      }
    ],
    chatMessages: [
      {
        id: 'msg-1',
        sender: 'assistant',
        text: '¡Hola Emanuel! Soy tu asistente de estudio con Inteligencia Artificial para este cuaderno sobre "Lean Startup y Modelo Canvas". Ya he analizado las 3 fuentes que cargaste (Eric Ries, Business Model Canvas y los casos de MVP). ¿Qué te gustaría hacer con este material? Puedes consultarme dudas conceptuales, o ir a la sección Artefactos para crear un nuevo recurso personalizado.',
        timestamp: '11:22 AM',
        sourcesCited: ['Eric Ries - El Método Lean Startup', 'Business Model Canvas', 'Casos Prácticos de MVP']
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: '¿Por qué Eric Ries dice que los planes de negocio tradicionales no funcionan en startups?',
        timestamp: '11:23 AM'
      },
      {
        id: 'msg-3',
        sender: 'assistant',
        text: 'De acuerdo con la Fuente 1 ("Eric Ries - El Método Lean Startup"), los planes de negocio tradicionales fallan porque fueron diseñados para empresas consolidadas que operan en mercados conocidos con pronósticos predecibles.\n\nEn cambio, una startup opera bajo **condiciones de incertidumbre extrema**: no sabe quién es su cliente exacto ni qué propuesta de valor será adoptada. Un plan rígido a 5 años asume certezas inexistentes y conduce a gastar tiempo y dinero en construir productos que nadie quiere.\n\n[Fuente: Eric Ries - El Método Lean Startup (Capítulos 1 al 4)]',
        timestamp: '11:24 AM',
        sourcesCited: ['Eric Ries - El Método Lean Startup (Capítulos 1 al 4)']
      }
    ],
    chatThreads: [
      {
        id: 'thread-lean-1',
        title: 'Preguntas Conceptuales Lean',
        createdAt: '2026-10-02 11:22',
        messages: [
          {
            id: 'msg-1',
            sender: 'assistant',
            text: '¡Hola Juan! Soy tu asistente de estudio con Inteligencia Artificial para este cuaderno sobre "Lean Startup y Modelo Canvas". Ya he analizado las 3 fuentes que cargaste (Eric Ries, Business Model Canvas y los casos de MVP). ¿Qué te gustaría hacer con este material? Puedes consultarme dudas conceptuales, o ir a la sección Artefactos para crear un nuevo recurso personalizado.',
            timestamp: '11:22 AM',
            sourcesCited: ['Eric Ries - El Método Lean Startup', 'Business Model Canvas', 'Casos Prácticos de MVP']
          },
          {
            id: 'msg-2',
            sender: 'user',
            text: '¿Por qué Eric Ries dice que los planes de negocio tradicionales no funcionan en startups?',
            timestamp: '11:23 AM'
          },
          {
            id: 'msg-3',
            sender: 'assistant',
            text: 'De acuerdo con la Fuente 1 ("Eric Ries - El Método Lean Startup"), los planes de negocio tradicionales fallan porque fueron diseñados para empresas consolidadas que operan en mercados conocidos con pronósticos predecibles.\n\nEn cambio, una startup opera bajo **condiciones de incertidumbre extrema**: no sabe quién es su cliente exacto ni qué propuesta de valor será adoptada. Un plan rígido a 5 años asume certezas inexistentes y conduce a gastar tiempo y dinero en construir productos que nadie quiere.\n\n[Fuente: Eric Ries - El Método Lean Startup (Capítulos 1 al 4)]',
            timestamp: '11:24 AM',
            sourcesCited: ['Eric Ries - El Método Lean Startup (Capítulos 1 al 4)']
          }
        ]
      },
      {
        id: 'thread-lean-2',
        title: 'Dudas sobre Canvas y MVP',
        createdAt: '2026-10-03 16:10',
        messages: [
          {
            id: 'msg-canvas-1',
            sender: 'assistant',
            text: 'Nuevo chat iniciado para este cuaderno. Comparte todas las fuentes (Eric Ries, Canvas y Casos de MVP). ¿En qué punto deseas profundizar?',
            timestamp: '04:10 PM',
            sourcesCited: ['Eric Ries - El Método Lean Startup', 'Business Model Canvas']
          },
          {
            id: 'msg-canvas-2',
            sender: 'user',
            text: '¿En qué bloques del Canvas impacta directamente el MVP?',
            timestamp: '04:12 PM'
          },
          {
            id: 'msg-canvas-3',
            sender: 'assistant',
            text: 'Según la Fuente 2 (Osterwalder) y la Fuente 1 (Ries), el MVP impacta primordialmente en la dimensión de **Deseabilidad**: somete a prueba la relación entre la **Propuesta de Valor** y los **Segmentos de Clientes**, además de validar los **Canales** de llegada y la disposición a pagar (Fuentes de Ingresos).\n\n[Fuente: Alexander Osterwalder - Business Model Canvas (9 Bloques)]',
            timestamp: '04:13 PM',
            sourcesCited: ['Alexander Osterwalder - Business Model Canvas (9 Bloques)']
          }
        ]
      }
    ],
    activeChatThreadId: 'thread-lean-1'
  }
];

export const INITIAL_USER_STATS: UserStudyStats = {
  focusMinutesToday: 55,
  totalFocusHours: 14.8,
  currentStreakDays: 6,
  xpPoints: 480,
  sessionsCompleted: 11,
  flashcardsMastered: 18,
  tamperAttemptsBlocked: 3,
  weeklyLogs: [
    { day: 'Lun', fullDay: 'Lunes', date: 'Lun 29', minutes: 45, targetMinutes: 45, sessions: 2 },
    { day: 'Mar', fullDay: 'Martes', date: 'Mar 30', minutes: 60, targetMinutes: 45, sessions: 3 },
    { day: 'Mié', fullDay: 'Miércoles', date: 'Mié 01', minutes: 35, targetMinutes: 45, sessions: 1 },
    { day: 'Jue', fullDay: 'Jueves', date: 'Jue 02', minutes: 50, targetMinutes: 45, sessions: 2 },
    { day: 'Vie', fullDay: 'Viernes', date: 'Vie 03', minutes: 75, targetMinutes: 45, sessions: 3 },
    { day: 'Sáb', fullDay: 'Sábado', date: 'Sáb 04', minutes: 30, targetMinutes: 45, sessions: 1 },
    { day: 'Dom', fullDay: 'Domingo (Hoy)', date: 'Hoy', minutes: 55, targetMinutes: 45, sessions: 2 }
  ]
};
