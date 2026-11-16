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
| `npm run db:seed:courses` | Carga cuatro cursos de ejemplo para el docente indicado en `SEED_TEACHER_EMAIL`. |
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


## Docente virtual: voz, avatar y sesiones

El arranque de Docker aplica el esquema Prisma, incluidas `TutorSession` y `TutorChatTurn`. Los intentos se registran con avance atómico de turno y puntaje acumulado. Si Gemini no puede evaluar, el turno queda pendiente; no se asigna una nota de respaldo.

La voz del dispositivo funciona sin credenciales adicionales. El selector de voz permite corregir la elección automática, que depende de las voces instaladas. Los eventos de palabras del navegador y sus visemas son aproximados; no todos los motores emiten límites de palabra.

Para voz neural con palabras y visemas sincronizados, configurar en el entorno del backend (o en el `.env` de Compose):

```dotenv
AZURE_SPEECH_KEY=su_clave
AZURE_SPEECH_REGION=su_region
```

Se usan es-ES-AlvaroNeural y es-ES-ElviraNeural. La velocidad se aplica al audio y las marcas siguen el reloj de reproducción. Nunca se envían claves Azure al navegador.

Para conversación continua por audio, configurar `GEMINI_API_KEY` y `GEMINI_LIVE_MODEL` con un modelo Live habilitado en la cuenta. Por ejemplo, `gemini-3.1-flash-live-preview` si sigue disponible en su proyecto. El chat ofrece un botón independiente para iniciar y finalizar este modo. Se emiten tokens de un solo uso, restringidos al modelo y contexto, con diez minutos de vigencia; la clave permanente no sale del servidor. La conversación Live no asigna calificaciones. Al interrumpir, se vacía el audio pendiente. La transcripción Live resalta el turno activo; no proporciona la misma precisión por palabra que Azure. La captura requiere HTTPS en producción (localhost es válido en desarrollo) y permiso de micrófono. Este modo utiliza la velocidad nativa del modelo.

El avatar predeterminado es un busto 3D minimalista original, renderizado con Three.js y sin texturas ni archivos externos. Los perfiles masculino/femenino se coordinan con el selector de voz. El gesto sigue palabras ya pronunciadas: enumeración con «primero», énfasis con «recuerda», reflexión con «piensa» y ánimo o felicitación según el contenido; la puntuación permite volver a reposo. En ausencia de señales semánticas varía según el tiempo real del habla. La simulación docente incluye un selector para probar cada gesto y una demostración continua. Tiene gestos de manos abiertas, señalamiento, enumeración, reflexión, escucha, ánimo y felicitación; las transiciones usan interpolación amortiguada. Cabeza y torso acompañan el habla y se respeta la preferencia de movimiento reducido. También se pueden configurar modelos VRM propios mediante `VITE_TUTOR_VRM_MALE_URL` y `VITE_TUTOR_VRM_FEMALE_URL` al compilar. Si falla un VRM personalizado se usa el avatar minimalista.

Después de configurar el entorno, reconstruir:

```sh
docker compose -f docker-compose.prod.yml up --build -d
```

Verificación local: `npm test -- --runInBand tutor-session.spec.ts tutor.service.spec.ts`. Las pruebas de aceptación HTTP cubren puntaje acumulado, fallo de IA sin nota, rechazo de turnos duplicados y la imposibilidad de que un estudiante active la simulación para omitir la persistencia.
