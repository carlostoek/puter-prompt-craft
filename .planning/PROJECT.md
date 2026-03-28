# Project: Puter-Prompt-Craft (v2.0)

## Project Overview

Transformación de una aplicación de gestión de prompts existente hacia un sistema inteligente de **categorización y extracción de metadatos con IA**.

## Current State

- **Repository:** `github.com/carlostoek/puter-prompt-craft`
- **Platform:** Puter.com (web app)
- **Tech Stack:** HTML, CSS, JavaScript vanilla, Puter.js
- **Status:** Functional MVP with basic CRUD + AI improvement

## Problem Statement

La aplicación actual:
- ✅ Permite crear, editar, eliminar prompts
- ✅ Usa IA para **mejorar** prompts
- ❌ No categoriza automáticamente por tipo (imagen/video/código)
- ❌ No extrae metadatos estructurados
- ❌ No permite búsquedas avanzadas por metadatos

## Vision

Convertir la aplicación en un sistema que:
1. **Clasifica automáticamente** prompts por tipo (image, video, code)
2. **Extrae metadatos** estructurados usando IA
3. **Organiza** con sistema de tags y categorías anidadas
4. **Permite búsquedas avanzadas** por cualquier metadato

## Inspiration: Existing Prompt System

Basado en el sistema en `~/repos/prompts`:

### Metadata Schema (YAML frontmatter)
```yaml
---
id: unique-identifier
type: image|video|code
subtype: portrait_restorealistic|selfies|javascript|etc
tags: [tag1, tag2, tag3]
camera:
  angle: low_angle|eye_level|dutch_angle|etc
  shot_type: selfie|mirror|medium_shot|etc
  lens: 24mm|smartphone|DSLR|etc
  movement: ligero_dinamismo|estatico|etc
subject:
  pose: caminando|parado|agachado|etc
  orientation: frontal|perfil|espaldas|tres_cuartos|etc
  framing: medio|closeup|full_body|etc
  expression: natural|sonriendo|serio|etc
setting:
  location: urbano|interior|naturaleza|etc
  lighting: golden_hour|natural|artificial|etc
  time: dia|tarde|noche|etc
  background: desenfoque_bokeh|nitido|etc
created: YYYY-MM-DD
usage_count: N
---
```

## Target Platform

- **Puter.com** - Plataforma cloud con:
  - Autenticación integrada
  - Almacenamiento KV persistente
  - IA integrada (puter.ai.chat)
  - File system access (puter.fs)

## Success Criteria

- [ ] Usuario puede pegar un prompt y la IA lo categoriza automáticamente
- [ ] Metadata YAML se genera y guarda con cada prompt
- [ ] Búsquedas filtradas por tipo, subtipo, tags, y metadatos específicos
- [ ] Export/import de prompts en formato Markdown con YAML frontmatter
- [ ] UI moderna y responsive manteniendo el tema oscuro actual

## Constraints

- Mantener compatibilidad con Puter.js v2
- No usar frameworks externos (vanilla JS)
- Tema oscuro con acentos personalizables
- Funcionamiento offline-first con sync a Puter

---

**Created:** 2026-03-28
**Last Updated:** 2026-03-28
