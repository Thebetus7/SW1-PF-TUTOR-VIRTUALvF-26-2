# SDD-Spec-Clarify: Auditoría de Calidad y Refinamiento Ágil (QA Gate)

Este workflow actúa como el **filtro de calidad (QA Gate)** para auditar y clarificar un archivo `spec.md` antes de avanzar al plan técnico.

> **Objetivo Pragmático**:
> Detectar **ambigüedades reales de negocio, contradicciones lógicas o supuestos técnicos no resueltos**. 
> Queda prohibido formular preguntas triviales sobre estilos de UI o micro-interacciones visuales que el copiloto técnico debe resolver por criterio estándar. Si la especificación ya cubre la lógica y las reglas esenciales de negocio, debe aprobarse ágilmente.

---

## 1. Resolución del Módulo a Auditar (`[XX.]`)

Cuando el usuario invoque este workflow:
1. **Con Argumento `[XX.]` o `[XX]`**: Extrae el identificador numérico y localiza la carpeta correspondiente en `docs/specs/`.
2. **Sin Argumento**: Selecciona automáticamente el último módulo disponible con `spec.md`.

---

## 2. Checklist de Auditoría (4 Dimensiones Clave)

El asistente verifica:

### Dimensión 1: Trazabilidad y Consistencia
- [ ] Cada `HU-XX` tiene sus `RF-XX.Y` derivados y al menos un `SC-XX.Y.Z` en Gherkin.
- [ ] No existen identificadores huérfanos o contradictorios.

### Dimensión 2: Reglas de Negocio Claras y Sintaxis EARS
- [ ] Los requisitos funcionales expresan claramente qué debe suceder ante eventos, estados o errores.
- [ ] Cero términos subjetivos o no testeables ("rápido", "intuitivo", "adecuado").

### Dimensión 3: Cobertura de Escenarios BDD Esenciales
- [ ] Se contempla el flujo exitoso (*Happy Path*) y al menos un escenario de error o caso de borde relevante para el negocio.
- [ ] Los pasos `Given / When / Then` modelan resultados observables por el usuario.

### Dimensión 4: Principio de Caja Negra y No Sobre-Especificación UI
- [ ] Libre de código fuente, consultas SQL o detalles internos de implementación.
- [ ] Libre de sobre-especificación cosmética de UI (el documento se enfoca en valor funcional).

---

## 3. Protocolo de Clarificación

1. **Si no hay vacíos críticos de negocio**:
   - El asistente confirma que la especificación es sólida y suficiente, aprobando el avance directo a `/sdd-planning`.
2. **Si existen ambigüedades reales de negocio**:
   - Expone brevemente los puntos débiles detectados.
   - Plantea preguntas puntuales y concisas (máximo 2 o 3) enfocadas en las reglas de negocio pendientes.
   - Tras la respuesta del usuario, actualiza directamente `docs/specs/XX-nombre/spec.md` con los ajustes acordados.
