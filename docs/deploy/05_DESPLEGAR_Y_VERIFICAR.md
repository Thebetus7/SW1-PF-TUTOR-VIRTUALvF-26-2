# 🚀 05: Desplegar y Verificar en Producción

Este documento detalla el procedimiento exacto para clonar, configurar y levantar los contenedores en el servidor, seguido de la lista de chequeo de verificación funcional.

---

## 1. Clonar y Configurar en el Servidor

Dentro de la sesión SSH de tu máquina virtual:

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git skylearn-prod
cd skylearn-prod

# 2. Crear el archivo de variables .env
cp .env.prod.example .env

# 3. Editar variables (agrega tu GEMINI_API_KEY y contraseñas seguras)
nano .env
# Guarda con CTRL+O, ENTER y sal con CTRL+X
```

---

## 2. Levantar el Stack Completo

Ejecuta el comando único de orquestación de Docker Compose:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Verificación inmediata del estado de los contenedores:
```bash
docker compose -f docker-compose.prod.yml ps
```

Deberías ver los 3 servicios en estado **Up**:
```text
NAME                     IMAGE                  COMMAND                  SERVICE      STATUS      PORTS
skylearn-postgres-prod   postgres:16-alpine     "docker-entrypoint.s…"   postgres     Up          5432/tcp
skylearn-backend-prod    skylearn-backend-prod  "/usr/bin/dumb-init …"   backend      Up          3000/tcp
skylearn-frontend-prod   skylearn-frontend-prod "/docker-entrypoint.…"   frontend     Up          0.0.0.0:80->80/tcp
```

---

## 3. Inspeccionar los Logs del Proceso de Inicio

Para comprobar que PostgreSQL aceptó conexiones, Prisma aplicó el esquema y se sembraron los datos de prueba:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

En la salida verás:
```text
🚀 [Skylearn Backend] Iniciando verificaciones previas...
⏳ Esperando conexión con PostgreSQL...
✅ PostgreSQL está disponible en postgres:5432
📦 Aplicando esquema de base de datos con Prisma...
The database is now in sync with the Prisma schema.
🌱 RUN_SEED=true: Sembrando datos iniciales en la base de datos...
Sembrando datos demo oficiales...
Seed completado exitosamente.
🎯 [Skylearn Backend] Todo listo. Arrancando servidor...
[Nest] LOG Nest application successfully started
```

*(Presiona `CTRL + C` para salir de la vista de logs en tiempo real)*.

---

## 4. Pruebas de Verificación en el Navegador

Abre tu navegador en tu computadora local:

### A. Prueba del Frontend Web React (SPA)
Visita: `http://TU_IP_PUBLICA/`
- Debe cargar la interfaz de Skylearn con estilos, navegación y catálogo de cursos.
- Inicia sesión con el usuario demo:
  - **Correo:** `student@test.com`
  - **Contraseña:** `Password123!`
- Verifica que el estudiante tiene sus 3 créditos y puede abrir las lecciones y el Tutor Virtual 3D.

### B. Prueba de la Documentación Swagger de la API
Visita: `http://TU_IP_PUBLICA/api/docs`
- Debe cargar la página interactiva Swagger OpenAPI mostrando todos los endpoints REST (`/api/v1/auth`, `/api/v1/courses`, `/api/v1/tutor`, etc.).

---

## 5. Conexión de la App Móvil Docente (`frontend-mobile`)

La app móvil en React Native (Expo) no corre en el servidor; corre en el teléfono del docente o emulador local.
Para conectarla con este servidor de Azure:
1. En tu máquina de desarrollo local, abre el archivo `frontend-mobile/src/services/api.ts`.
2. Asigna la IP pública de tu servidor de Azure:
   ```typescript
   export const API_BASE_URL = 'http://TU_IP_PUBLICA/api/v1';
   ```
3. Ejecuta la app con `npx expo start`.
4. Inicia sesión en el móvil con el docente demo:
   - **Correo:** `teacher@test.com`
   - **Contraseña:** `Password123!`
5. Podrás ver los 3 KPIs del dashboard docente y el estado del semáforo de alumnos consumiendo datos reales de producción.
