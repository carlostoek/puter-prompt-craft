# Requirements: Puter-Prompt-Craft v2.0

## Functional Requirements

### FR-1: Autenticación en Puter
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-1.1 | La app debe autenticarse vía Puter.js | High |
| FR-1.2 | Mostrar estado de sesión (logged in/out) | High |
| FR-1.3 | Persistir sesión entre recargas | Medium |

### FR-2: Categorización Automática con IA
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-2.1 | Al guardar un prompt, la IA debe clasificarlo en: image, video, o code | High |
| FR-2.2 | La IA debe sugerir un subtype basado en el contenido | High |
| FR-2.3 | El usuario puede editar la categoría antes de guardar | Medium |
| FR-2.4 | Soporte para categorías personalizadas | Low |

### FR-3: Extracción de Metadatos con IA
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-3.1 | Extraer automáticamente tags relevantes | High |
| FR-3.2 | Extraer metadatos de cámara (angle, shot_type, lens) | High |
| FR-3.3 | Extraer metadatos de sujeto (pose, orientation, framing) | High |
| FR-3.4 | Extraer metadatos de entorno (location, lighting, time) | Medium |
| FR-3.5 | Generar ID único para cada prompt | High |
| FR-3.6 | El usuario puede editar todos los metadatos antes de guardar | Medium |

### FR-4: Gestión de Prompts (CRUD)
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-4.1 | Crear nuevo prompt con metadata | High |
| FR-4.2 | Editar prompt existente | High |
| FR-4.3 | Eliminar prompt con confirmación | High |
| FR-4.4 | Duplicar prompt | Low |
| FR-4.5 | Historial de versiones (opcional) | Low |

### FR-5: Búsqueda y Filtrado Avanzado
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-5.1 | Búsqueda por texto libre (título, descripción, contenido) | High |
| FR-5.2 | Filtrar por tipo (image/video/code) | High |
| FR-5.3 | Filtrar por subtipo | High |
| FR-5.4 | Filtrar por tags | High |
| FR-5.5 | Filtrar por metadatos de cámara | Medium |
| FR-5.6 | Filtrar por metadatos de sujeto | Medium |
| FR-5.7 | Filtrar por metadatos de entorno | Low |
| FR-5.8 | Combinar múltiples filtros | High |
| FR-5.9 | Guardar búsquedas frecuentes | Low |

### FR-6: Exportación e Importación
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-6.1 | Exportar prompt individual como Markdown con YAML frontmatter | High |
| FR-6.2 | Exportar múltiples prompts como ZIP | Medium |
| FR-6.3 | Importar prompts desde Markdown | High |
| FR-6.4 | Importar lote desde ZIP | Medium |
| FR-6.5 | Copiar prompt al portapapeles | High |

### FR-7: UI/UX
| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-7.1 | Tema oscuro profesional | High |
| FR-7.2 | Diseño responsive (desktop, tablet, mobile) | High |
| FR-7.3 | Sidebar de navegación con categorías | High |
| FR-7.4 | Vista de cards para prompts | High |
| FR-7.5 | Modal para crear/editar con secciones colapsables | High |
| FR-7.6 | Toast notifications | High |
| FR-7.7 | Loading states | High |
| FR-7.8 | Vista previa de metadata YAML | Medium |

---

## Non-Functional Requirements

### NFR-1: Rendimiento
| ID | Requisito |
|----|-----------|
| NFR-1.1 | Carga inicial < 2 segundos |
| NFR-1.2 | Búsquedas < 500ms para < 1000 prompts |
| NFR-1.3 | IA response < 10 segundos |

### NFR-2: Confiabilidad
| ID | Requisito |
|----|-----------|
| NFR-2.1 | Persistencia automática en Puter.kv |
| NFR-2.2 | Manejo de errores de red |
| NFR-2.3 | Confirmación antes de eliminar |

### NFR-3: Seguridad
| ID | Requisito |
|----|-----------|
| NFR-3.1 | Autenticación vía Puter (no manejar credenciales) |
| NFR-3.2 | Datos aislados por usuario en Puter.kv |

### NFR-4: Mantenibilidad
| ID | Requisito |
|----|-----------|
| NFR-4.1 | Código modular y comentado |
| NFR-4.2 | Separación clara de responsabilidades (MVC pattern) |
| NFR-4.3 | Configuración externalizada |

---

## Technical Requirements

### TR-1: Plataforma
| ID | Requisito |
|----|-----------|
| TR-1.1 | Puter.js v2.x |
| TR-1.2 | Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge) |
| TR-1.3 | Sin dependencias externas (vanilla JS) |

### TR-2: Almacenamiento
| ID | Requisito |
|----|-----------|
| TR-2.1 | Puter.kv para datos estructurados |
| TR-2.2 | Puter.fs para exportación de archivos |
| TR-2.3 | Schema JSON para prompts |

### TR-3: IA
| ID | Requisito |
|----|-----------|
| TR-3.1 | puter.ai.chat() para categorización |
| TR-3.2 | Prompts del sistema para extracción de metadata |
| TR-3.3 | Output estructurado (JSON) de la IA |

---

## Out of Scope (v2.0)

- [ ] Colaboración/multi-usuario
- [ ] API REST externa
- [ ] Browser extension
- [ ] Desktop app
- [ ] Integración con otras plataformas de IA
- [ ] Analytics de uso de prompts
- [ ] A/B testing de prompts
- [ ] Versionado avanzado

---

**Created:** 2026-03-28
**Status:** Approved
