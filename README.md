# Skylearn - Plataforma LMS Adaptativa e Inteligente

Ecosistema integral desacoplado compuesto por **3 proyectos independientes** bajo una arquitectura de especificación ágil (SDD):

1. **`backend/`**: API RESTful central en **NestJS 11**, **Prisma ORM**, **PostgreSQL**, **Google Gemini API** (con resiliencia y cascade fallback) y **Stripe Developer Mode**.
2. **`frontend-web/`**: Aplicación web reactiva en **React 19 + TypeScript (Vite)** para estudiantes (catálogo, temarios, reproductor YouTube, tutor 3D Three.js y exámenes) y gestión curricular docente.
3. **`frontend-mobile/`**: Aplicación móvil nativa en **React Native (Expo SDK 57)** para docentes (dashboard de 3 KPIs, semáforo didáctico y push notifications).

---

## ⚡ Comandos Rápidos desde la Raíz

Puedes operar los 3 proyectos cómodamente desde la raíz del repositorio sin necesidad de moverte entre carpetas:

| Acción | Comando desde la Raíz | Descripción |
| :--- | :--- | :--- |
| **Setup Completo de Cero** | `npm run setup` | Instala dependencias en los 3 proyectos y prepara la BD con seed. |
| **Sincronizar y Sembrar BD** | `npm run db:setup` | Aplica el esquema Prisma y siembra las cuentas y cursos demo. |
| **Sembrar datos demo** | `npm run db:seed` | Siembra únicamente los datos de prueba en la base de datos. |
| **Iniciar Backend (NestJS)** | `npm run start:dev` | Levanta el servidor API en [http://localhost:3000](http://localhost:3000). |
| **Iniciar Frontend Web (React)** | `npm run dev:web` | Levanta el cliente web en [http://localhost:5173](http://localhost:5173). |
| **Iniciar Frontend Móvil (Expo)** | `npm run dev:mobile` | Inicia Metro Bundler para celular o navegador web (`w`). |
| **Tests BDD E2E del Backend** | `npm run test:backend` | Ejecuta las suites de pruebas de integración de punta a punta. |
| **Compilar Backend** | `npm run build:backend` | Valida y genera el bundle de producción de NestJS. |
| **Compilar Frontend Web** | `npm run build:web` | Valida tipos y genera el bundle de producción con Vite. |

---

## 📁 Documentación Específica por Proyecto

Para instrucciones detalladas de cada proyecto particular, consulta sus respectivos archivos:

- 📖 [Backend README](backend/README.md)
- 📖 [Frontend Web README](frontend-web/README.md)
- 📖 [Frontend Mobile README](frontend-mobile/README.md)

---

## 🔑 Credenciales de Prueba

- **Estudiante**: `student@test.com` / `Password123!`
- **Docente**: `teacher@test.com` / `Password123!`
- **Administrador**: `admin@test.com` / `Password123!`
