# Skylearn - Guía Maestra para Levantar el Proyecto Local

Bienvenido a la guía oficial de despliegue local de **Skylearn**, una plataforma educativa adaptativa e inteligente compuesta por **3 proyectos desacoplados e independientes**:

1. 🟢 **`backend/`**: API RESTful central en **NestJS 11**, **Prisma ORM**, **PostgreSQL**, **Google Gemini API** (con resiliencia y cascade fallback) y **Stripe Developer Mode**.
2. 🔵 **`frontend-web/`**: Aplicación web SPA en **React 19 + TypeScript (Vite)** para estudiantes (catálogo, temarios, reproductor YouTube, tutor 3D Three.js y exámenes) y gestión curricular docente.
3. 🟣 **`frontend-mobile/`**: Aplicación móvil nativa en **React Native (Expo SDK 57)** para docentes (dashboard de 3 KPIs, semáforo pedagógico y notificaciones push).

---

## 📋 Prerrequisitos del Sistema

Antes de iniciar, asegúrate de tener instalado en tu equipo:

- **Node.js**: Versión `v18.0.0` o superior (se recomienda `v20.x` LTS o `v22.x`).
  - Verifica tu versión con: `node -v`
- **npm**: Gestor de paquetes incluido con Node.js (`npm -v`).
- **PostgreSQL**: Servidor de base de datos relacional activo (puerto estándar `5432`).
- *(Opcional para móvil)*:
  - App móvil **Expo Go** instalada en tu teléfono Android o iOS (para pruebas en dispositivo físico).
  - O **Android Studio** con un emulador AVD configurado (para pruebas en emulador).

---

## ⚡ Método 1: Inicio Rápido Automatizado (Recomendado)

Si es tu primera vez levantando el proyecto, puedes preparar e instalar todo en un solo comando ejecutado desde la raíz del repositorio:

```bash
# 1. Instala dependencias en los 3 proyectos y prepara la BD con datos demo
npm run setup
```

Este comando realiza internamente:
1. `npm install` en `backend/`, `frontend-web/` y `frontend-mobile/`.
2. Sincronización del esquema Prisma con PostgreSQL (`prisma db push`).
3. Siembra de datos demo oficiales (`prisma db seed`).

Una vez terminado el setup, abre **3 terminales independientes** en la raíz del repositorio para iniciar cada servicio:

```bash
# Terminal 1: Iniciar Backend (NestJS) -> http://localhost:3000
npm run start:dev

# Terminal 2: Iniciar Frontend Web (React Vite) -> http://localhost:5173
npm run dev:web

# Terminal 3: Iniciar Frontend Móvil (Expo) -> Metro Bundler
npm run dev:mobile
```

---

## 🛠️ Método 2: Paso a Paso por Proyecto

Si prefieres levantar o depurar cada componente de forma individual, sigue este orden secuencial:

```mermaid
flowchart LR
    BD[(PostgreSQL)] --> B[1. Backend NestJS :3000]
    B --> W[2. Frontend Web React :5173]
    B --> M[3. Frontend Móvil Expo :8081]
```

---

### Paso 1: Configurar y Levantar el Backend (`backend/`)

El backend es el núcleo del ecosistema; debe iniciarse primero para proveer datos a las aplicaciones web y móvil.

#### 1.1 Entrar al directorio del backend
```bash
cd backend
```

#### 1.2 Instalar dependencias
```bash
npm install
```

#### 1.3 Configurar variables de entorno (`.env`)
Verifica o crea el archivo `.env` en la raíz de `backend/` a partir de `.env.example`:

```bash
# En Windows (PowerShell):
Copy-Item .env.example .env

# En Linux / macOS / Git Bash:
cp .env.example .env
```

Abre el archivo `backend/.env` y ajusta tus credenciales de PostgreSQL si tu contraseña o usuario difieren:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:tu_password_aqui@localhost:5432/gestor_notas_db?schema=public"

# Autenticación JWT
JWT_SECRET="super-secret-jwt-key-gestor-notas-2026-univalle"
JWT_EXPIRES_IN="24h"

# Google Gemini API (Capa Gratuita)
GEMINI_API_KEY="AIzaSyDemoKeyForDevelopmentMode2026"
GEMINI_DEFAULT_MODEL="gemini-2.5-flash"

# Pasarela de Pagos Stripe (Modo de Desarrollo)
STRIPE_SECRET_KEY="sk_test_51MockStripeSecretKeyForEducation2026"
STRIPE_WEBHOOK_SECRET="whsec_mock_webhook_secret_for_tests_2026"
STRIPE_SUCCESS_URL="http://localhost:5173/payment/success"
STRIPE_CANCEL_URL="http://localhost:5173/payment/cancel"
```

> [!NOTE]
> La base de datos `gestor_notas_db` debe existir en tu PostgreSQL local. Si aún no existe, puedes crearla desde pgAdmin, DBeaver o con el comando SQL:
> `CREATE DATABASE gestor_notas_db;`

#### 1.4 Sincronizar el esquema y sembrar datos de prueba
Aplica el modelo de datos y carga los usuarios, cursos y exámenes iniciales:
```bash
npm run db:setup
```

*(Si en el futuro solo necesitas resetear o resembrar datos sin recrear tablas, usa `npm run db:seed`)*.

#### 1.5 Iniciar el servidor NestJS
```bash
npm run start:dev
```

#### 1.6 Verificar funcionamiento del Backend
Abre tu navegador para comprobar los servicios activos:
- 🌐 **API Base**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- 📖 **Documentación interactiva Swagger**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- 🗄️ **Prisma Studio (Explorador visual de la BD)**: Abre otra terminal en `backend/` y ejecuta `npx prisma studio` para acceder a [http://localhost:5555](http://localhost:5555).

---

### Paso 2: Levantar el Frontend Web (`frontend-web/`)

La aplicación web permite a los estudiantes navegar por los cursos, consumir lecciones con el avatar 3D y rendir exámenes, así como a los docentes crear cursos y temarios.

#### 2.1 Entrar al directorio del frontend web
```bash
cd frontend-web
```

#### 2.2 Instalar dependencias
```bash
npm install
```

#### 2.3 Iniciar el servidor Vite
```bash
npm run dev
```

#### 2.4 Acceder a la aplicación
Abre tu navegador en:
👉 **[http://localhost:5173](http://localhost:5173)**

> [!TIP]
> El frontend web viene preconfigurado para conectarse automáticamente a `http://localhost:3000/api/v1`. No requiere configuración extra de `.env` a menos que desees cambiar la URL del backend mediante la variable `VITE_API_URL`.

---

### Paso 3: Levantar el Frontend Móvil (`frontend-mobile/`)

La aplicación móvil está orientada a docentes para monitorear el **Dashboard de 3 KPIs**, la salud pedagógica de los cursos mediante semáforos y recibir alertas push.

#### 3.1 Entrar al directorio móvil
```bash
cd frontend-mobile
```

#### 3.2 Instalar dependencias
```bash
npm install
```

#### 3.3 Iniciar Metro Bundler con Expo
```bash
npm start
# o también:
npx expo start
```

Verás un código QR en la consola y las opciones de interacción. Puedes visualizar la aplicación de **3 formas distintas**:

---

#### 📱 Forma A: En el Navegador Web (La opción más rápida sin emulador)
Si no cuentas con emulador ni teléfono a mano, puedes correr la versión web de React Native al instante:
1. Con la terminal de Expo activa, presiona la tecla **`w`** (o ejecuta `npm run web`).
2. Se abrirá automáticamente en tu navegador en [http://localhost:8081](http://localhost:8081).
3. **Recomendación visual**: Presiona `F12` en el navegador y activa el modo de emulación de dispositivo móvil en las DevTools para visualizar la interfaz con proporción de teléfono.

---

#### 📲 Forma B: En tu Celular Físico con Expo Go (Recomendado)
Para experimentar la experiencia táctil nativa y recibir notificaciones:
1. Descarga la aplicación gratuita **Expo Go** en tu smartphone:
   - **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
2. **Importante**: Conecta tu teléfono a la **misma red Wi-Fi** que tu computadora.
3. Abre la app en tu teléfono:
   - **En Android**: Abre Expo Go, presiona el botón **"Scan QR code"** y escanea el código QR que se muestra en tu terminal.
   - **En iOS**: Abre la app **Cámara nativa** de tu iPhone, enfoca el código QR y presiona la notificación emergente de Expo Go.

> [!IMPORTANT]
> **Aviso de conectividad en teléfono real**: Cuando pruebas en un celular físico, `localhost` apunta al celular mismo y no a tu computadora. Si deseas que la app móvil se comunique con tu backend local en NestJS, edita la constante `BACKEND_URL` en `frontend-mobile/src/services/notifications.ts` reemplazando `localhost` por la IP local de tu PC (por ejemplo `http://192.168.1.50:3000/api/v1`), o inicia Expo en modo túnel ejecutando `npx expo start --tunnel`.

---

#### 💻 Forma C: En un Emulador de Android Studio
Si tienes instalado **Android Studio** con un dispositivo virtual configurado:
1. Inicia tu emulador AVD desde el **Device Manager** de Android Studio.
2. En la terminal donde corre Expo, presiona la tecla **`a`** (o ejecuta directamente `npm run android`).
3. Expo compilará el bundle y lo abrirá automáticamente dentro del emulador.

> [!NOTE]
> Para comunicarse con el backend de tu computadora desde el emulador de Android Studio, la dirección estándar que representa a la máquina anfitriona es `http://10.0.2.2:3000/api/v1`.

---

## ⌨️ Atajos de Teclado en la Terminal de Expo

| Tecla | Acción |
| :---: | :--- |
| **`w`** | Abre o recarga la aplicación en el navegador web. |
| **`a`** | Abre la aplicación en el emulador de Android conectado. |
| **`i`** | Abre la aplicación en el simulador de iOS (solo en macOS con Xcode). |
| **`r`** | Recarga la aplicación en el dispositivo (*Reload*). |
| **`m`** | Abre el menú de desarrollo de Expo en el dispositivo conectado. |
| **`j`** | Abre el depurador de Chrome / DevTools. |
| **`Ctrl + C`** | Detiene el servidor de Expo. |

---

## 🔑 Credenciales de Acceso Demo

El seeder del sistema (`npm run db:seed`) deja pre-cargadas las siguientes cuentas de prueba con contraseñas ya hasheadas:

| Rol | Correo Electrónico | Contraseña | Alcance y Vistas |
| :--- | :--- | :--- | :--- |
| 🎓 **Estudiante** | `student@test.com` | `Password123!` | Cuenta con 3 créditos iniciales para desbloquear lecciones, avatar 3D, chat con tutor y exámenes. |
| 👨‍🏫 **Docente** | `teacher@test.com` | `Password123!` | Acceso al panel de gestión curricular en la Web (`#/teacher/courses`) y al **Dashboard de KPIs / Semáforo** en la app móvil. |
| 🛡️ **Administrador** | `admin@test.com` | `Password123!` | Acceso completo de auditoría y configuración general. |

---

## 🧭 Resumen de Puertos y URLs en Local

| Servicio | Puerto Local | URL Principal | Descripción |
| :--- | :---: | :--- | :--- |
| **Backend REST API** | `3000` | [http://localhost:3000/api/v1](http://localhost:3000/api/v1) | Endpoint base de la API NestJS. |
| **Swagger OpenAPI** | `3000` | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Explorador interactivo de endpoints y DTOs. |
| **Frontend Web** | `5173` | [http://localhost:5173](http://localhost:5173) | Cliente web React 19 para estudiantes y profesores. |
| **Frontend Móvil (Web)** | `8081` | [http://localhost:8081](http://localhost:8081) | Metro Bundler / versión web de la app móvil. |
| **Prisma Studio** | `5555` | [http://localhost:5555](http://localhost:5555) | GUI visual para explorar y editar la base de datos PostgreSQL. |

---

## 🧪 Pruebas Automatizadas y Calidad

Puedes comprobar la integridad de todo el código ejecutando los tests y análisis estáticos:

```bash
# Ejecutar tests de integración y E2E del backend
npm run test:backend
# o desde la carpeta backend:
cd backend && npm run test:e2e

# Ejecutar tests unitarios del backend
cd backend && npm run test

# Validar tipado y compilación en producción del backend
npm run build:backend

# Validar tipado y compilación de frontend web
npm run build:web
```

---

## ❓ Preguntas Frecuentes y Solución de Problemas

<details>
<summary><strong>1. Error al conectar con PostgreSQL (`P1001: Can't reach database server`)</strong></summary>

- Verifica que el servicio de PostgreSQL esté iniciado en tu sistema operativo (`services.msc` en Windows o `sudo service postgresql status` en Linux).
- Revisa que las credenciales (usuario, contraseña y puerto) en `backend/.env` coincidan con tu instalación local.
- Asegúrate de que la base de datos `gestor_notas_db` exista en PostgreSQL.
</details>

<details>
<summary><strong>2. El celular físico no se conecta al backend en Expo Go</strong></summary>

- Verifica que tanto la computadora como el teléfono móvil estén conectados a la **misma red Wi-Fi** (evita redes públicas con aislamiento de clientes o redes de invitados).
- Revisa el Firewall de Windows para asegurar que el puerto `3000` permita conexiones entrantes.
- Configura en `frontend-mobile/src/services/notifications.ts` la dirección IP local de tu PC (ej. `http://192.168.1.X:3000/api/v1`) en lugar de `localhost`.
- Alternativamente, puedes iniciar Expo con soporte de túnel usando: `npx expo start --tunnel`.
</details>

<details>
<summary><strong>3. Puerto 3000, 5173 u 8081 ya en uso</strong></summary>

- En Windows, para liberar un puerto ocupado:
  ```powershell
  # Identificar el PID del proceso en el puerto (ejemplo: 3000)
  netstat -ano | findstr :3000
  # Terminar el proceso por PID
  taskkill /PID <PID_NUMERO> /F
  ```
</details>
