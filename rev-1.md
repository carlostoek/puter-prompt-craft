
🚀 Phase 1 — Metadata System v2 (Robust, Normalized, Searchable)

🎯 Phase Goal

Transform the current prompt storage system into a robust metadata-driven retrieval system that:

1. Extracts structured metadata using AI (single call)


2. Normalizes and repairs AI output before usage


3. Stores consistent, clean, and scalable metadata


4. Enables meaningful search (not just filtering)


5. Minimizes user friction while preserving control




---

⚠️ Non-Negotiable Principles

1. AI output is unreliable by default

Never trust raw AI JSON

Always normalize and repair



2. Consistency > Intelligence

Clean, predictable data beats “smart” messy data



3. Search is the product

Metadata exists only to improve retrieval



4. Low friction wins

Metadata should not block saving





---

🧱 Core Architecture

Data Flow (MANDATORY)

User Input
   ↓
AI Extraction (single call)
   ↓
normalizeAIResponse()
   ↓
validateAndRepair()
   ↓
UI فرم (editable)
   ↓
savePrompt()


---

🧩 Task Breakdown (Revised)


---

🧠 Task 1.1 — Flexible Metadata Schema (Scalable)

Replace rigid schema with flexible structure

const METADATA_SCHEMA = {
  id: string,
  type: 'image' | 'video' | 'code' | 'uncategorized',
  subtype: string,
  tags: string[],
  confidence: number,

  attributes: {
    // dynamic key-value pairs depending on type
    // example:
    // camera_angle: "low angle"
    // lighting: "soft natural light"
    // language: "python"
  },

  created: ISO8601,
  updated: ISO8601
};

Rules:

❌ DO NOT hardcode camera, subject, setting

✅ Use attributes as flexible container

✅ Only store relevant fields



---

🤖 Task 1.2 — Unified AI Extraction (Strict Output Contract)

Requirements:

Single AI call

JSON ONLY (no markdown, no text)


Output format:

{
  "type": "image|video|code|uncategorized",
  "subtype": "string",
  "confidence": 0.0,
  "tags": ["tag1", "tag2"],
  "attributes": {
    "key": "value"
  }
}


---

🛠️ Task 1.3 — AI Response Normalization Layer (CRITICAL)

Create:

function normalizeAIResponse(raw) {}

Responsibilities:

Fix invalid JSON

Ensure required fields exist

Convert types:

string → array (tags)

null → empty values


Trim strings

Lowercase tags


Example fixes:

"tags": "portrait, sexy"
→ ["portrait", "sexy"]

missing subtype
→ "other"

invalid confidence
→ default 0.5


---

🧪 Task 1.4 — Validation & Repair Layer

Create:

function validateAndRepair(metadata) {}

Responsibilities:

Enforce schema

Remove unknown fields

Ensure:

type is valid

tags length ≤ 8

attributes is object


Fill defaults safely



---

🏷️ Task 1.5 — Tag Normalization System

Create:

function normalizeTag(tag) {
  return tag.toLowerCase().trim();
}

Rules:

Deduplicate tags

Remove empty tags

Max 8 tags

Optional: synonym mapping (future phase)



---

⚡ Task 1.6 — Low-Friction UX Flow

Changes:

AI metadata is auto-applied immediately

User can edit optionally

NO forced validation before save


Remove:

“Use Extracted” button


Add:

Visual confidence indicator:

High (green)

Medium (yellow)

Low (red)




---

💾 Task 1.7 — Save Function (Clean & Consistent)

Structure:

const prompt = {
  id,
  title,
  description,
  content,

  metadata: {
    type,
    subtype,
    tags,
    confidence,
    attributes
  },

  created,
  updated
};

Rules:

Always pass through:

normalize

validate


Backward compatibility:

default type = 'uncategorized'




---

🔍 Task 1.8 — Search Engine (Weighted Scoring)

Create:

function scorePrompt(prompt, query) {}

Scoring logic:

score =
  title match * 3 +
  tags match * 2 +
  description match * 1 +
  content match * 1

Requirements:

Case insensitive

Partial matches allowed

Sort results by score DESC



---

🔎 Task 1.9 — Filtering System

Filters:

Type

Tags (clickable)

Text search


Combine filters:

results = prompts
  .filter(byType)
  .filter(byTag)
  .map(scorePrompt)
  .sort(byScore)


---

🧠 Task 1.10 — AI Call Optimization (Cost Control)

Create:

function hashPrompt(content) {}

Behavior:

Cache AI results by hash

Skip AI call if same content already processed



---

🧪 Task 1.11 — Real Testing Dataset

Create test set:

50–100 prompts:

image

video

code

ambiguous



Measure:

Type accuracy

Tag usefulness (manual evaluation)


Reality target:

✅ 70–80% acceptable

❌ DO NOT assume 90%



---

⚠️ Removed / Changed Concepts

Removed	Reason

Hardcoded camera/subject blocks	Not scalable
"Use Extracted" button	Adds friction
source (ai/manual/mixed)	Low value vs complexity
90% accuracy goal	Unrealistic



---

✅ Final Verification Checklist

[ ] AI output always passes through normalize + validate

[ ] Tags are clean, deduplicated, lowercase

[ ] Metadata never breaks UI (even with bad AI output)

[ ] Saving works without forcing user edits

[ ] Search returns relevant results (not just matches)

[ ] Filters combine correctly

[ ] Prompts without metadata still load correctly

[ ] AI calls are cached

[ ] System handles malformed AI responses gracefully



---

🧨 Final Directive (para Codex)

> This system must prioritize data consistency, fault tolerance, and search quality over AI sophistication.

Any AI output must be treated as unreliable input and MUST pass through normalization and validation layers before being used or stored.

The system should degrade gracefully under bad AI responses and never break the user experience.




📊 Evaluación General

Veredicto: El plan es sólido y bien estructurado, con buenas prácticas de defensa contra la inconsistencia de LLMs. Sin embargo, identifico áreas críticas que necesitan atención antes de la implementación.

---

✅ Fortalezas Identificadas

1. Filosofía de "Distrust by Default"
El principio de que "AI output is unreliable by default" con capas de normalización y validación es correcto y esencial. Esto evitará que prompts mal categorizados corrompan tu base de datos.

2. Metadata Flexible vs. Esquema Rígido
El cambio de campos hardcodeados (camera/subject) a un contenedor `attributes` dinámico es escalable y permitirá adaptarse a nuevos tipos de contenido sin migraciones dolorosas.

3. Flujo de Baja Fricción
Eliminar el botón "Use Extracted" y aplicar metadata automáticamente con edición opcional es UX inteligente. No interrumpes el flujo del usuario pero mantienes el control.

4. Sistema de Ponderación en Búsqueda
El scoring ponderado (title×3, tags×2, description×1) demuestra comprensión de prioridades de información. Es un algoritmo simple pero efectivo para empezar.

5. Optimización de Costos (Hash/Caché)
El `hashPrompt()` para evitar llamadas redundantes a la IA demuestra pensamiento en producción y control de gastos en APIs.

---

⚠️ Riesgos y Debilidades Críticas

1. Falta de Sistema de Migración de Datos
Problema: El plan no menciona cómo manejarás los prompts existentes en la base de datos del proyecto original que no tienen metadata estructurada.

Riesgo: Tendrás una base de datos mixta (viejos prompts sin metadata vs nuevos con metadata), lo que romperá las búsquedas y filtros.

Recomendación: Agrega una tarea:

```javascript
// Task 1.12 — Backfill Migration
function migrateLegacyPrompts() {
  // Procesar prompts existentes en batch
  // Usar AI extraction con rate limiting
  // Marcar prompts migrados vs pendientes
}
```

2. Validación Insuficiente de `subtype`
Problema: El schema permite cualquier string en `subtype`, pero el plan no define un vocabulario controlado.

Riesgo: Tendrás fragmentación: `"portrait"`, `"Portrait"`, `"portraits"`, `"human-portrait"` como subtipos diferentes, arruinando los filtros.

Recomendación: Implementa un `subtypeRegistry` limitado o usa IA para normalizar subtypes contra una taxonomía controlada.

3. Sin Estrategia de Confianza (Confidence)
Problema: El campo `confidence` es numérico, pero no hay reglas sobre qué hacer con scores bajos.

Riesgo: ¿Un prompt con confidence 0.3 se guarda igual? ¿Se marca para revisión? ¿Se ignora en búsquedas?

Recomendación: Define umbrales de acción:
- `confidence < 0.4`: Marcar como "Needs Review", no indexar en búsquedas globales
- `confidence 0.4-0.7`: Aceptar pero mostrar warning visual persistente
- `confidence > 0.7`: Confianza total

4. Ausencia de Relaciones Entre Prompts
Problema: El schema es plano (no hay jerarquías o relaciones).

Riesgo real: En sistemas de prompts, es común tener variaciones de un mismo prompt (A/B testing, versiones para diferentes LLMs, o prompts padre/hijo). Sin `parentId` o `relatedPrompts`, perderás contexto.

Recomendación: Agrega al schema:

```javascript
{
  metadata: {
    // ... campos existentes
    lineage: {
      parentId: string | null,
      version: number,
      variants: string[] // IDs de prompts relacionados
    }
  }
}
```

5. Potencial Problema de Rendimiento en Búsqueda
Problema: El plan menciona `scorePrompt()` aplicado a todos los prompts en memoria/frontend.

Riesgo: Con 1000+ prompts, el scoring lineal en JavaScript del frontend será lento.

Recomendación: 
- Si usas backend: implementar índices en la base de datos (Elasticsearch, SQLite FTS, PostgreSQL full-text search)
- Si es localStorage/indexedDB: considera un web worker para búsquedas pesadas

6. Falta de Estrategia de Fallback para AI
Problema: Si la API de IA falla (rate limit, timeout, error 500), ¿qué pasa?

Riesga: El usuario no puede guardar su prompt.

Recomendación: Agrega:

```javascript
async function extractMetadataWithFallback(content) {
  try {
    return await aiExtract(content);
  } catch (error) {
    console.warn('AI extraction failed, using fallback:', error);
    return {
      type: 'uncategorized',
      subtype: 'unknown',
      confidence: 0,
      tags: [],
      attributes: {},
      needsAIReview: true // flag para reintentar después
    };
  }
}
```

---

🔧 Recomendaciones Específicas de Implementación

1. Schema Evolution Strategy
Dado que iterarás sobre este sistema, considera agregar `schemaVersion` al objeto prompt:

```javascript
const prompt = {
  id,
  schemaVersion: 2, // Para futuras migraciones
  // ... resto
}
```

2. Tag Synonym Map (Inmediato, no "Future Phase")
En lugar de dejar synonym mapping para "futuro", implementa un mapa básico desde el día 1 para evitar deuda técnica:

```javascript
const TAG_SYNONYMS = {
  'portrait': ['portrait', 'headshot', 'face', 'person'],
  'landscape': ['landscape', 'scenery', 'nature', 'outdoor'],
  'code': ['code', 'programming', 'script', 'development']
};
// Usar para expandir búsquedas (search "portrait" también encuentra "headshot")
```

3. Manejo de Contenido Multimodal
El sistema detecta tipos (image/video/code), pero ¿cómo sabe la IA qué tipo es si solo recibe texto del prompt?

Sugerencia: Agrega detección basada en el contenido del prompt mismo:

```javascript
function detectTypeFromContent(content) {
  if (content.includes('--ar') || content.includes('photograph')) return 'image';
  if (content.includes('function') || content.includes('```')) return 'code';
  // ...
}
```

Úsalo para validar contra lo que la IA devolvió (sanity check).

4. Testing Dataset Realista
El plan pide 50-100 prompts para testing. Crítico: Asegúrate de incluir casos edge:
- Prompts muy cortos (1-2 palabras)
- Prompts muy largos (5000+ caracteres)
- Prompts ambiguos intencionalmente ("write a python script that draws a sunset")
- Prompts en múltiples idiomas
- Prompts con código mezclado con descripción natural

---

🎯 Prioridades de Implementación Sugeridas

Fase	Tareas	Justificación	
P0 (Crítico)	1.3 (Normalization), 1.4 (Validation), 1.7 (Save), Migration Strategy	Sin esto, el sistema es inestable	
P1 (Alto)	1.2 (AI Extraction), 1.6 (UX Flow), 1.8 (Search), Fallback handling	Core functionality	
P2 (Medio)	1.5 (Tags), 1.9 (Filters), 1.10 (Cache), Confidence thresholds	Optimización y refinamiento	
P3 (Bajo)	1.11 (Testing dataset), Tag synonyms, Lineage tracking	Mejoras y deuda técnica futura	

---

💡 Mejora Arquitectónica Adicional

Considera implementar un Event Sourcing ligero para el flujo de metadata:

```javascript
// En lugar de solo guardar el estado final, guarda la trazabilidad
const metadataEvents = [
  { type: 'AI_EXTRACTED', timestamp, data: rawAIOutput, confidence },
  { type: 'USER_EDITED', timestamp, changes: { tags: { old: [], new: ['portrait'] } } },
  { type: 'NORMALIZED', timestamp, rulesApplied: ['trim', 'dedupe'] }
];
```

Esto permite debugging de por qué un prompt está categorizado de cierta forma, y permite "reprocesar" prompts si mejoras tus reglas de normalización.

---

📋 Checklist Adicional para tu Implementación

- Manejo de duplicados: ¿Qué pasa si guardo el mismo prompt dos veces? ¿Hash del contenido para detectar duplicados?
- Export/Import: ¿Podrás exportar la metadata junto con los prompts para backup?
- Compresión de attributes: Si `attributes` crece mucho, considera indexar solo keys específicas para búsqueda
- Auditoría de costos: Logging de cuántas llamadas a IA haces realmente vs caché hits
- Dark mode para UI: Los indicadores de confianza (verde/amarillo/rojo) deben ser accesibles para daltónicos (icons + color)

---
