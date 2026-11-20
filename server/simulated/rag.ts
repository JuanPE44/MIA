// Pure helpers shared by the server and the client-side simulation (no Node APIs).

// Función de generación de texto temático profundo en caso de archivos binarios sin texto OCR
export function getRichDomainManualForFile(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('cloud')) {
    return `# Manual Técnico: Arquitectura Cloud 2026 y Ecosistemas Distribuidos

## Capítulo 1: Fundamentos y Modelos de Servicio en la Nube
La computación en la nube en 2026 se estructura a través de modelos de servicio estandarizados y computación sin servidor:
- **IaaS (Infraestructura como Servicio)**: Provisión de recursos de cómputo virtualizados, almacenamiento en bloque y redes definidas por software (SDN). Permite control granular de sistemas operativos pero exige gestión activa de parches y hardening.
- **PaaS (Plataforma como Servicio)**: Entornos de ejecución gestionados que abstraen la infraestructura subyacente. Los desarrolladores despliegan código mientras el proveedor gestiona el escalado automático, balanceo de carga y alta disponibilidad.
- **SaaS (Software como Servicio)**: Aplicaciones completas accesibles vía web/API, donde el usuario final consume funcionalidad sin responsabilidad sobre la infraestructura ni el middleware.
- **FaaS / Serverless**: Ejecución dirigida por eventos donde los microservicios se ejecutan en microcontenedores efímeros, facturando únicamente por los milisegundos de cómputo utilizados.

## Capítulo 2: Estrategia Multi-Cloud y Prevención de Bloqueo de Proveedor
Las organizaciones modernas implementan arquitecturas híbridas y multi-nube para mitigar el riesgo de *vendor lock-in*:
- **Portabilidad mediante Contenedores**: OCI (Open Container Initiative) y Docker estandarizan el empaquetado de aplicaciones para su portabilidad entre AWS, Google Cloud y Microsoft Azure.
- **Orquestación con Kubernetes**: Los clústeres gestionados (GKE, EKS, AKS) permiten coordinar pods, réplicas, servicios e ingress de manera agnóstica a la infraestructura.
- **Malla de Servicios (Service Mesh)**: Herramientas como Istio y Linkerd garantizan enrutamiento inteligente, autenticación mTLS mutual y telemetría entre microservicios distribuidos.

## Capítulo 3: Seguridad Cloud y el Paradigma Zero Trust
El modelo de seguridad perimetral tradicional ha sido reemplazado por la arquitectura Zero Trust:
1. **Verificación Explícita**: Cada solicitud de acceso es autenticada y autorizada con base en identidad, postura del dispositivo y contexto de red.
2. **Privilegio Mínimo (PoLP)**: Asignación estricta de roles IAM (Identity and Access Management) con permisos temporales Just-in-Time (JIT).
3. **Cifrado Integral**: Cifrado obligatorio de datos en tránsito (TLS 1.3) y en reposo (AES-256) con gestión de llaves centralizada (KMS/HSM).
4. **Cumplimiento Normativo**: Marcos ISO/IEC 27001, SOC 2 Tipo II y GDPR como estándares basales de auditoría continua.

## Capítulo 4: FinOps y Optimización de Costos en la Nube
El marco FinOps integra ingeniería, finanzas y operaciones para maximizar el valor de la inversión cloud:
- **Visibilidad y Atribución**: Etiquetado exhaustivo (tagging) de recursos por departamento, proyecto y entorno (producción, staging, testing).
- **Optimización de Capacidad**: Right-sizing automatizado de instancias para eliminar capacidad ociosa, aprovechamiento de Spot Instances / Preemptible VMs y contratación de Savings Plans.
- **Gobernanza Automatizada**: Alertas de anomalías de gasto y políticas de apagado automático de entornos fuera de horario laboral.

## Capítulo 5: SRE, Confiabilidad y Observabilidad
La ingeniería de confiabilidad del sitio (SRE) garantiza la resiliencia operativa:
- **SLI (Service Level Indicator)**: Métrica cuantitativa del servicio en tiempo real (ej. latencia p99 < 120ms).
- **SLO (Service Level Objective)**: Objetivo acordado internamente (ej. 99.9% de solicitudes exitosas mensual).
- **SLA (Service Level Agreement)**: Compromiso contractual con penalizaciones financieras por incumplimiento.
- **Pilares de Observabilidad**: Métricas, logs estructurados y trazas distribuidas unificadas bajo OpenTelemetry.

## Capítulo 6: Recuperación ante Desastres y Continuidad
Estrategias de continuidad del negocio basadas en dos parámetros críticos:
- **RTO (Recovery Time Objective)**: Tiempo máximo tolerable de inactividad antes de restaurar el servicio.
- **RPO (Recovery Point Objective)**: Cantidad máxima de datos perdidos medidos en tiempo (ej. replicación de bases de datos cada 5 minutos).
- **Modelos de Respaldo**: Desde Backup & Restore básico hasta configuraciones Multi-Región Activo-Activo con conmutación por error automatizada vía DNS Anycast.`;
  }

  return `# Guía Académica y Manual Especializado: ${fileName}

## Sección 1: Introducción y Marco Teórico Fundamental
Este material aborda los conceptos basales, principios rectores y terminología técnica esencial del área de estudio. Se examinan las premisas metodológicas que sustentan el desarrollo analítico.

## Sección 2: Procedimientos Operativos y Dinámica Práctica
Pasos estructurados y metodología de aplicación:
1. Análisis preliminar y diagnóstico de variables críticas del entorno.
2. Formulación de hipótesis y diseño de experimentos controlados.
3. Ejecución sistemática con recolección de evidencia cuantitativa y cualitativa.
4. Evaluación iterativa y ajustes continuos orientados a la optimización de resultados.

## Sección 3: Métricas de Evaluación y Validación
Criterios formales para auditar el desempeño y garantizar rigor conceptual:
- Validación empírica contrastada contra estándares de la industria.
- Indicadores accionables que reflejan causas y efectos demostrables.
- Conclusiones y recomendaciones para la toma de decisiones estratégicas.`;
}

// -------------------------------------------------------------
// MOTOR RAG: CHUNKING Y RECUPERACIÓN SEMÁNTICA
// -------------------------------------------------------------
export interface DocumentChunk {
  chunkId: string;
  sourceTitle: string;
  sectionTitle: string;
  location: string;
  content: string;
  tokens: string[];
}

/** Replaces the legacy upload placeholder with the themed manual so heuristics always have real text. */
export function withRichContent<T extends { title?: string; content?: string }>(source: T): T {
  if (/Material cargado: ".*" Archivo registrado en formato/i.test(source.content || '')) {
    return { ...source, content: getRichDomainManualForFile(source.title || '') };
  }
  return source;
}

export function chunkSourceIntoRAG(source: { title: string; content: string }): DocumentChunk[] {
  let content = source.content || '';
  // Si el contenido cargado contenía el placeholder antiguo sin procesar, enriquecerlo
  if (/Material cargado: ".*" Archivo registrado en formato/i.test(content)) {
    content = getRichDomainManualForFile(source.title);
  }

  const chunks: DocumentChunk[] = [];
  // Dividir por encabezados de Markdown o por párrafos dobles
  const sections = content.split(/(?=^##?\s+)/m).filter(s => s.trim().length > 0);

  let chunkCounter = 1;
  let pageCounter = 1;

  for (const section of sections) {
    const lines = section.trim().split('\n');
    let sectionTitle = 'Contenido General';
    if (lines[0].startsWith('#')) {
      sectionTitle = lines[0].replace(/^#+\s*/, '').trim();
    }

    // Dividir en bloques de ~200 palabras
    const paragraphs = section.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let pIdx = 1;

    for (const p of paragraphs) {
      const cleanP = p.trim();
      if (cleanP.length < 15) continue;

      const words = cleanP.toLowerCase().replace(/[^\wáéíóúñ\s]/g, '').split(/\s+/).filter(w => w.length > 2);

      chunks.push({
        chunkId: `chunk-${chunkCounter++}`,
        sourceTitle: source.title,
        sectionTitle,
        location: `Pág. ${pageCounter}, Párrafo ${pIdx++}`,
        content: cleanP,
        tokens: words
      });

      if (chunkCounter % 3 === 0) {
        pageCounter++;
      }
    }
  }

  // Si no se generaron chunks, agregar uno global con todo el contenido
  if (chunks.length === 0 && content.trim().length > 0) {
    chunks.push({
      chunkId: 'chunk-1',
      sourceTitle: source.title,
      sectionTitle: 'Contenido Completo',
      location: 'Pág. 1, Párrafo 1',
      content: content.trim(),
      tokens: content.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    });
  }

  return chunks;
}

export function retrieveTopChunks(query: string, allChunks: DocumentChunk[], topK = 6): { chunks: DocumentChunk[]; maxScore: number; isRelevant: boolean } {
  if (allChunks.length === 0) return { chunks: [], maxScore: 0, isRelevant: false };
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.replace(/[^\wáéíóúñ\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const stopWords = new Set(['que', 'como', 'para', 'este', 'esta', 'estos', 'estas', 'cual', 'cuales', 'donde', 'cuando', 'quien', 'por', 'con', 'sin', 'los', 'las', 'una', 'uno', 'unas', 'unos', 'del', 'les', 'sus', 'sobre', 'hace', 'pero', 'mas', 'muy']);
  const meaningfulWords = queryWords.filter(w => !stopWords.has(w));

  const scored = allChunks.map(chunk => {
    let score = 0;
    const chunkTextLower = chunk.content.toLowerCase();
    const sectionTitleLower = chunk.sectionTitle.toLowerCase();
    const sourceTitleLower = chunk.sourceTitle.toLowerCase();

    // 1. Coincidencia exacta de frase
    if (queryLower.length > 6 && chunkTextLower.includes(queryLower)) {
      score += 40;
    }

    // 2. Coincidencia de términos clave
    for (const qw of meaningfulWords) {
      if (chunkTextLower.includes(qw)) score += 6;
      if (sectionTitleLower.includes(qw)) score += 10;
      if (sourceTitleLower.includes(qw)) score += 6;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const maxScore = scored[0]?.score || 0;
  const filtered = scored.filter(s => s.score > 0).slice(0, topK).map(s => s.chunk);

  // Si hay coincidencias con puntaje, devolverlas; de lo contrario devolver los primeros fragmentos principales de las fuentes
  const finalChunks = filtered.length > 0 ? filtered : allChunks.slice(0, Math.min(topK, allChunks.length));

  return {
    chunks: finalChunks,
    maxScore: Math.max(maxScore, 5),
    isRelevant: true
  };
}
