# SDD-Constitution: Constitución del Proyecto (Plantilla Directa)

> Versión: 1.0.0 | Estado: Activa y Vinculante

Este documento define las reglas de juego, misión, arquitectura, estándares de calidad y principios innegociables del proyecto bajo la metodología **Spec-Driven Development (SDD)**.

---

## 1. Misión y Dominio
- **Propósito**: [Descripción clara del problema que resuelve este sistema]
- **Core Concepts**: [Términos del negocio innegociables y lenguaje ubicuo]
- **Límites (Out of Scope)**: [Funcionalidades o requerimientos expresamente excluidos]

---

## 2. Tech Stack, Arquitectura y Suite de Testing
- **Frontend**: [Framework, motor de estilos, gestión de estado]
- **Backend / Servicios**: [Lenguaje, framework de API, arquitectura limpia / modular]
- **Persistencia**: [Motor de base de datos, ORM / query builder, migraciones]
- **Diseño y Estética**: [Paleta de colores, tipografías, accesibilidad]
- **Suite de Testing (Selección Autónoma de la IA)**:
  - **Caja Negra / Aceptación (BDD & E2E / API)**: Herramienta óptima para validar flujos de usuario (ej. Playwright, Supertest, Cypress).
  - **Caja Blanca / Estructural (Unit & Integration TDD)**: Runner nativo y rápido (ej. Vitest, Jest, PyTest, Go test).
- **Estándares de Codificación & Linters**:
  - **Tipado Estricto**: Cero uso de `any`, validación de esquemas en runtime.
  - **Nomenclatura**: `camelCase` para variables/funciones, `PascalCase` para componentes/tipos, `kebab-case` para archivos.
  - **Linters / Formateador**: Análisis estático sin advertencias (ESLint, Prettier, Biome, Ruff).
  - **Manejo de Errores Tipado**: Prohibición de bloques `catch` vacíos; uso de errores de dominio explícitos.

---

## 3. Infraestructura y Roadmap
- **Contenedores (Docker)**: Docker / Docker Compose para desarrollo local y producción.
- **Credenciales y Entornos**: Configuración centralizada vía `.env` / `.env.example`. Prohibido hardcodear secretos.
- **Flujo Git**: Convención de commits (Conventional Commits: `feat:`, `fix:`, `chore:`), ramas y PRs.
- **Fases del Roadmap**:
  - Fase 1: MVP Core
  - Fase 2: Integraciones y Features Secundarios
  - Fase 3: Hardening, Seguridad y Despliegue

---

## 4. Principios Innegociables
1. **Spec-First**: Ninguna línea de código de producción se escribe sin su correspondiente especificación aprobada en `docs/specs/`.
2. **Validación Dual Obligatoria**: Toda tarea o feature debe superar simultáneamente los tests de Caja Blanca (unitarios) y los de Caja Negra (Gherkin BDD).
3. **Calidad de Código**: Código 100% libre de advertencias de linter, cero código muerto y tipado completo.
4. **Seguridad y Privacidad**: Validación estricta de entradas en los bordes del sistema (Zero Trust).
5. **Idempotencia y Transaccionalidad**: Mutaciones de datos seguras y atómicas.

---

## 5. Comandos Oficiales del Proyecto
| Acción | Comando |
| :--- | :--- |
| Levantar Entorno Dev | `npm run dev` / `docker compose up` |
| Tests Caja Blanca (Unit) | `npm run test:unit` |
| Tests Caja Negra (E2E / BDD) | `npm run test:e2e` |
| Suite Completa & Cobertura | `npm test` |
| Formatear / Lint | `npm run lint` / `npm run format` |
| Verificación de Tipos | `npm run typecheck` |
| Migraciones DB | `npm run db:migrate` |
