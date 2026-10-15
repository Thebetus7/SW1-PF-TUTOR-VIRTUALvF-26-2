# Arquitectura Integral del Sistema (Archify Diagram)

Este directorio contiene el proyecto y artefacto de visualización arquitectónica interactiva generado con **Archify (v3.0)**, modelando la interacción de extremo a extremo entre el **Frontend Web (`frontend-web/`)**, el **Backend API (`backend/`)** y las plataformas en la nube.

---

## 📁 Archivos del Proyecto

| Archivo | Descripción |
| :--- | :--- |
| **[`system-architecture.html`](system-architecture.html)** | Diagrama interactivo autocontenido en HTML con gráficos vectoriales SVG, selector de tema oscuro/claro, zoom, paneo interactivo y exportación a PNG/SVG/WebP. |
| **[`system-architecture.json`](system-architecture.json)** | Definición declarativa y fuertemente tipada de la topología, componentes, límites de seguridad (*boundaries*), conexiones y tarjetas informativas. |

---

## 🖥️ ¿Cómo Ver el Diagrama Interactivo?

Puedes abrir directamente el archivo en cualquier navegador moderno:

1. **Desde tu explorador de archivos**:
   Haz doble clic sobre:
   ```text
   docs/architecture/system-architecture.html
   ```
2. **O desde la terminal**:
   ```bash
   start docs/architecture/system-architecture.html
   ```

---

## 🛠️ Comandos de Archify para Mantenimiento

Para regenerar, validar o inspeccionar el diagrama:

```bash
# 1. Compilar y renderizar el JSON hacia HTML interactivo
node .agents/skills/archify/bin/archify.mjs render architecture docs/architecture/system-architecture.json docs/architecture/system-architecture.html

# 2. Validar calidad de layout y clearance de etiquetas
node .agents/skills/archify/bin/archify.mjs check docs/architecture/system-architecture.html --json

# 3. Previsualizar con servidor local integrado
node .agents/skills/archify/bin/archify.mjs preview architecture docs/architecture/system-architecture.json docs/architecture/system-architecture.html
```

---

## 🏛️ Topología Representada en el Diagrama

```mermaid
flowchart LR
    subgraph Frontend["Frontend Web (React 19 + Vite :5173)"]
        A["Portal Estudiante"]
        B["Panel Curricular Docente"]
        C["Tutor Virtual 3D (Three.js)"]
        D["Hash Router & API Client"]
    end

    subgraph Backend["Backend Core API (NestJS 11 :3000)"]
        E["API Gateway & RFC 7807"]
        F["Auth & RBAC Guards"]
        G["Courses & Lessons Services"]
        H["Exams & Tutor Engine"]
        I["Payments Service"]
        J["Prisma ORM"]
    end

    subgraph Data["Persistencia Relacional"]
        K[("PostgreSQL 15+")]
    end

    subgraph External["Servicios Cloud"]
        L["Google Gemini AI (Cascade)"]
        M["Stripe Platform"]
        N["YouTube Video CDN"]
    end

    A --> D
    B --> D
    C --> D
    D -->|REST JSON + JWT| E
    E --> F
    E --> G
    E --> H
    E --> I
    G --> J
    H --> L
    I --> M
    J --> K
    A -.-> N
```
