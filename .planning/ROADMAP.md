# Roadmap: Puter-Prompt-Craft v2.0

## Overview

**Goal:** Transformar la app de "mejora de prompts" a "categorización y extracción de metadatos con IA"

**Timeline:** 4 Phases

---

## Phase 1: Foundation — Metadata & IA Categorization

**Goal:** Reemplazar la feature de "mejora con IA" por "categorización y extracción de metadatos"

### Tasks

| # | Task | Description | Est. |
|---|------|-------------|------|
| 1.1 | Update UI form | Reemplazar sección "AI Improvement" por "AI Metadata Extraction" | 2h |
| 1.2 | Create metadata schema | Definir estructura JSON para metadata (camera, subject, setting) | 1h |
| 1.3 | AI categorization prompt | Crear prompt del sistema para clasificar tipo (image/video/code) | 1h |
| 1.4 | AI metadata extraction | Crear prompt para extraer metadatos estructurados (JSON output) | 2h |
| 1.5 | Update save function | Guardar prompt con metadata en lugar de solo contenido | 2h |
| 1.6 | Update data model | Modificar schema de prompts para incluir todos los campos de metadata | 1h |
| 1.7 | Manual override | Permitir editar metadata antes de guardar | 1h |
| 1.8 | Testing | Probar flujo completo de guardado con IA | 2h |

### Deliverables
- [ ] Usuario guarda prompt → IA categoriza → IA extrae metadata → Usuario edita (opcional) → Guarda

### Success Criteria
- [ ] Prompt se guarda con metadata YAML completa
- [ ] Categoría correcta en 90%+ de casos
- [ ] Usuario puede editar metadata antes de guardar

**Estimated Time:** 12 horas

---

## Phase 2: Advanced Search & Filtering

**Goal:** Implementar búsquedas por metadatos y filtros avanzados

### Tasks

| # | Task | Description | Est. |
|---|------|-------------|------|
| 2.1 | Update search UI | Agregar filtros desplegables por tipo, subtipo, tags | 2h |
| 2.2 | Filter by type/subtype | Implementar lógica de filtrado por categoría | 1h |
| 2.3 | Filter by tags | Implementar búsqueda por tags | 2h |
| 2.4 | Filter by camera metadata | Ángulo, shot_type, lens | 2h |
| 2.5 | Filter by subject metadata | Pose, orientation, framing | 2h |
| 2.6 | Filter by setting metadata | Location, lighting, time | 1h |
| 2.7 | Combined filters | Permitir múltiples filtros simultáneos | 2h |
| 2.8 | Search results count | Mostrar número de resultados | 0.5h |
| 2.9 | Clear filters | Botón para resetear todos los filtros | 0.5h |
| 2.10 | Testing | Probar combinaciones de filtros | 2h |

### Deliverables
- [ ] Sidebar o toolbar con filtros avanzados
- [ ] Búsqueda en tiempo real combinando texto + filtros
- [ ] Contador de resultados

### Success Criteria
- [ ] Usuario puede encontrar prompts por cualquier metadato
- [ ] Filtros combinables sin errores
- [ ] UI responsive con filtros

**Estimated Time:** 15 horas

---

## Phase 3: Export/Import & Markdown Support

**Goal:** Exportar e importar prompts en formato Markdown con YAML frontmatter

### Tasks

| # | Task | Description | Est. |
|---|------|-------------|------|
| 3.1 | YAML frontmatter generator | Función para convertir metadata a YAML | 2h |
| 3.2 | Markdown exporter | Generar archivo .md con frontmatter + contenido | 2h |
| 3.3 | Single prompt export | Botón "Export" en cada card | 1h |
| 3.4 | Copy to clipboard | Copiar prompt formateado al portapapeles | 1h |
| 3.5 | Markdown parser | Leer archivos .md importados | 3h |
| 3.6 | YAML parser | Extraer metadata del frontmatter | 2h |
| 3.7 | Import UI | Modal o drag-drop para importar | 2h |
| 3.8 | Bulk export | Seleccionar múltiples y exportar como ZIP | 3h |
| 3.9 | Puter.fs integration | Guardar archivos en Puter File System | 2h |
| 3.10 | Testing | Probar round-trip (export → import) | 2h |

### Deliverables
- [ ] Botón "Export" en cada prompt
- [ ] Botón "Import" en toolbar
- [ ] Archivos .md con formato idéntico a `~/repos/prompts`

### Success Criteria
- [ ] Export genera YAML idéntico al schema
- [ ] Import lee correctamente YAML y restaura prompt
- [ ] Round-trip sin pérdida de datos

**Estimated Time:** 20 horas

---

## Phase 4: Polish & Advanced Features

**Goal:** Mejorar UX, agregar features avanzadas, preparar para producción

### Tasks

| # | Task | Description | Est. |
|---|------|-------------|------|
| 4.1 | Metadata visualization | Vista previa de YAML en el modal | 1h |
| 4.2 | Tag suggestions | IA sugiere tags adicionales | 2h |
| 4.3 | Usage counter | Incrementar contador cada vez que se copia | 1h |
| 4.4 | Recently viewed | Historial de prompts vistos recientemente | 2h |
| 4.5 | Favorites | Marcar prompts como favoritos | 2h |
| 4.6 | Duplicate detection | Alertar si prompt similar ya existe | 2h |
| 4.7 | Keyboard shortcuts | Atajos para acciones comunes | 2h |
| 4.8 | Dark theme polish | Mejorar contraste, hover states | 2h |
| 4.9 | Mobile optimization | Ajustes específicos para móvil | 2h |
| 4.10 | Error handling | Mejorar mensajes de error | 1h |
| 4.11 | Loading states | Skeleton screens | 1h |
| 4.12 | Documentation | README actualizado | 2h |
| 4.13 | Testing E2E | Probar flujos completos | 3h |

### Deliverables
- [ ] UX pulida y profesional
- [ ] Features avanzadas (favoritos, recientes, tags)
- [ ] Documentación completa

### Success Criteria
- [ ] App estable sin bugs críticos
- [ ] UX intuitiva y rápida
- [ ] README con instrucciones claras

**Estimated Time:** 21 horas

---

## Summary

| Phase | Focus | Est. Time | Deliverables |
|-------|-------|-----------|--------------|
| 1 | IA Categorization | 12h | Metadata extraction working |
| 2 | Search & Filters | 15h | Advanced filtering |
| 3 | Export/Import | 20h | Markdown support |
| 4 | Polish | 21h | Production-ready |
| **Total** | | **68 horas** | |

---

## Post-v2.0 (Future Considerations)

- [ ] Multi-user collaboration
- [ ] Prompt templates library
- [ ] A/B testing de prompts
- [ ] Analytics dashboard
- [ ] Browser extension
- [ ] API REST pública
- [ ] Integración con Midjourney, DALL-E, etc.

---

**Created:** 2026-03-28
**Next Action:** `/gsd:plan-phase 1`
