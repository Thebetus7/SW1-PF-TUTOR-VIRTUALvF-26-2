# Backend API - Plataforma LMS Adaptativa Skylearn

Servidor de API RESTful desacoplado, robusto y fuertemente tipado desarrollado con **NestJS 11**, **Prisma ORM**, **PostgreSQL 15+**, **Google Gemini API** (con resiliencia y cascade fallback) y **Stripe Developer Mode**.

---

## 📋 Requisitos Previos

1. **Node.js**: v18.0.0 o superior (recomendado v20+).
2. **PostgreSQL**: Servidor de base de datos activo (puerto por defecto: `5432`).
3. **Variables de Entorno**: Archivo `.env` en la raíz de `backend/` (copiar desde `.env.example`).
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skylearn_db?schema=public"
   JWT_SECRET="super-secret-skylearn-jwt-key-2026"
   GEMINI_API_KEY="AIzaSy..."
   STRIPE_SECRET_KEY="sk_test_..."
   PORT=3000
   ```

---

## 🚀 Comandos para Levantar el Backend

### 1. Desde esta carpeta (`backend/`)

```bash
# 1. Instalar dependencias
npm install

# 2. Sincronizar esquema Prisma y sembrar datos de prueba iniciales
npm run db:setup

# 3. Iniciar el servidor en modo desarrollo (con recarga automática)
npm run start:dev
```

### 2. O desde la raíz del repositorio principal

```bash
# Sincronizar y sembrar base de datos
npm run db:setup

# Iniciar servidor backend
npm run start:dev
# o también:
npm run dev:backend
```

---

## 🌐 Endpoints y Documentación Swagger

Una vez iniciado el servidor, accede a:

- **API Base URL**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Documentación Swagger UI interactiva**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🛠️ Comandos de Base de Datos y Mantenimiento

| Comando | Descripción |
| :--- | :--- |
| `npm run db:setup` | Aplica el esquema a la BD (`prisma db push`) y ejecuta el seed inicial. |
| `npm run db:seed` | Siembra usuarios, categorías y cursos demo. |
| `npm run db:push` | Sincroniza cambios de `schema.prisma` directamente sin crear archivo de migración. |
| `npm run db:migrate` | Genera y aplica migraciones formales (`prisma migrate dev`). |
| `npx prisma studio` | Abre el panel visual de base de datos en [http://localhost:5555](http://localhost:5555). |

---

## 🧪 Pruebas Automatizadas y Calidad

```bash
# Ejecutar suite de pruebas BDD E2E completas
npm run test:e2e

# Ejecutar tests unitarios
npm run test

# Verificar compilación de TypeScript
npm run build

# Formatear código con Prettier
npm run format
```

---

## 🔑 Cuentas Demo Sembradas

| Rol | Correo Electrónico | Contraseña | Perfil y Acceso |
| :--- | :--- | :--- | :--- |
| **Estudiante** | `student@test.com` | `Password123!` | 3 Créditos freemium, catálogo, temarios y tutor 3D. |
| **Docente** | `teacher@test.com` | `Password123!` | Creación de cursos, temarios de lecciones y exámenes. |
| **Administrador** | `admin@test.com` | `Password123!` | Control global y reseteo de datos demo. |
