# SDD-Spec-Anchored-Task: Adición de Tareas Atómicas por Actualización de Spec

Este workflow analiza las modificaciones en `docs/specs/XX-feature/plan.md` e inserta las nuevas tareas atómicas en `docs/specs/XX-feature/tasks.md` sin alterar las tareas ya completadas.

---

## 1. Protocolo de Modificación
1. Lee `docs/specs/XX-feature/tasks.md` y preserva todas las tareas finalizadas (`[x]`).
2. Añade las nuevas tareas bajo la numeración correspondiente (ej. `[T-4.1]`, `[T-4.2]`).
3. Asigna a cada tarea su correspondiente verificación TDD y validación dual (Caja Blanca + Caja Negra).
4. Deja el checklist listo para ejecutar vía `/sdd-execution`.
