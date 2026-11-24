# Frontend Móvil - Skylearn Docente (React Native & Expo)

Aplicación móvil orientada exclusivamente al **Docente / Creador de Contenido**, construida con **React Native (Expo SDK 58)**, **TypeScript** y componentes Skylearn. Permite monitorear el **Dashboard de 3 KPIs**, el semáforo pedagógico de salud de cursos con detección de lección crítica y la recepción de **notificaciones push automáticas** (Firebase Cloud Messaging - FCM) ante nuevas inscripciones de alumnos en la plataforma web.

## Generar y probar el APK Android

### 1. Preparar PowerShell

Instala Node.js para Windows si hace falta. Abre PowerShell y ejecuta:

```powershell
Set-Location 'C:\EDBERTO\AVANCE\SW1\SW1-PF-TUTOR-VIRTUALvF-26-2\frontend-mobile'
node.exe --version
npm.cmd --version
npm.cmd ci
```

Si acabas de instalar Node.js y la terminal no lo encuentra, cierra y vuelve a abrir la aplicación de terminal. Para actualizar la sesión actual si usaste el instalador estándar, ejecuta `$env:Path = "C:\Program Files\nodejs;$env:Path"` y repite las comprobaciones. Usa `npm.cmd` y `npx.cmd` en PowerShell para ejecutar los comandos aunque el sistema bloquee los archivos `.ps1`.

### 2. Entrar al proyecto de Expo

```powershell
npx.cmd --yes eas-cli login
npx.cmd --yes eas-cli whoami
npx.cmd --yes eas-cli project:info
```

Usa una cuenta con acceso a `@ilusion/frontend-mobile`. Si ya tienes sesión iniciada, empieza por `whoami`.

### 3. Revisar la configuración Android

- Comprueba que `google-services.json` corresponda a `com.skylearn.docente`. Si el archivo se administra desde EAS, configura la variable de archivo `GOOGLE_SERVICES_JSON` para el entorno `preview`.
- Conserva la clave de firma Android que ya tiene el proyecto. Para probar notificaciones remotas, verifica también que EAS tenga la credencial FCM v1 del mismo proyecto Firebase. Puedes revisar ambas con `npx.cmd --yes eas-cli credentials --platform android`.
- Revisa `EXPO_PUBLIC_API_URL` en el perfil `preview` de [eas.json](./eas.json). Usa un backend accesible desde el teléfono y común a la web y la app.

### 4. Generar y descargar el APK

```powershell
npx.cmd --yes eas-cli build --platform android --profile preview
```

El perfil `preview` genera un APK para distribución interna. EAS muestra el enlace de seguimiento cuando recibe el proyecto. Cuando el estado sea `Finished`, abre ese enlace desde el teléfono y descarga el APK. Para volver a encontrar una compilación terminada, ejecuta:

```powershell
npx.cmd --yes eas-cli build:list --platform android --status finished
```

### 5. Probar la notificación de matrícula

Instala el APK, inicia sesión como docente y concede el permiso de notificaciones. Deja la app en segundo plano. En la web, entra con un alumno que todavía no esté matriculado en un curso de ese docente y pulsa **Inscribirme al Curso**. Comprueba que el teléfono reciba **Nueva inscripción en tu curso**.

El botón **Probar** genera una notificación local. La recepción de la alerta de matrícula es la comprobación de la entrega remota. Expo Go admite la prueba local en Android.

---

## 📌 Resumen Arquitectónico: ¿Por qué EAS Build en la Nube y no Local?

> [!IMPORTANT]
> **Lección aprendida & Arquitectura oficial:**
> 1. **Expo Go NO soporta notificaciones remotas de producción (FCM):** En las versiones modernas de Expo (SDK 52+), Expo Go no carga certificados de Firebase (`google-services.json`), por lo que no puede recibir push notifications reales del backend. Requiere un binario independiente (**`.apk`**).
> 2. **Compilación local en Windows descartada:** Ejecutar `./gradlew assembleDebug` o `npx expo run:android` en Windows suele fallar debido al límite de 260 caracteres (`MAX_PATH`), espacios en rutas (`PROYECTO FINAL`) y conflictos de CMake / Ninja en C++.
> 3. **Solución estándar de la industria:** Se utiliza **Expo EAS Build** (servidores Linux optimizados de Expo en la nube) con el perfil `preview` para compilar un archivo binario `.apk` 100% nativo, listo para descargar e instalar en cualquier teléfono Android.

---

## ⚙️ Configuración de Variables de Entorno (`.env` y `eas.json`)

Para que la aplicación móvil se comunique con el backend NestJS, la variable `EXPO_PUBLIC_API_URL` debe apuntar a una IP alcanzable desde el dispositivo móvil (**nunca `localhost`**):

### Archivo `.env` (en `frontend-mobile/`):
```env
# Servidor en la Nube / Azure VM (Acceso directo por puerto 80 vía Nginx, sin :3000):
EXPO_PUBLIC_API_URL=http://172.174.113.121/api/v1

# O si pruebas con Backend local en tu misma red Wi-Fi (reemplaza con tu IPv4 de ipconfig):
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1
```

> [!NOTE]
> En [eas.json](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-mobile/eas.json), el perfil `preview` ya incluye por defecto la variable `EXPO_PUBLIC_API_URL` para que el APK compilado en la nube se enlace automáticamente al servidor.

---

## 📲 ¿Dónde se Descarga y Cómo se Instala el APK?

### ¿Dónde encuentro el instalable?
1. **En la Terminal:** Al finalizar la compilación, la terminal imprimirá un **código QR** y una URL directa de descarga (ejemplo: `https://expo.dev/artifacts/eas/...apk`).
2. **En la Web de Expo:** 
   - Ve a [expo.dev](https://expo.dev) e inicia sesión.
   - Entra al proyecto **frontend-mobile** -> menú lateral izquierdo **Deploy > Builds**.
   - Haz clic en la compilación con ícono verde (Finished) y pulsa el botón **"Download"** o **"Install"** para escanear el QR desde tu celular.

### 🛡️ Instalación en el Teléfono Android (Bypass de Google Play Protect):
Al ser un archivo `.apk` compilado para pruebas (modo preview / self-signed keystore), Android mostrará advertencias de seguridad habituales:
1. **Permiso de orígenes desconocidos:** Cuando el navegador te pregunte, activa *"Permitir instalar aplicaciones de esta fuente"*.
2. **Advertencia de Google Play Protect ("App bloqueada por Play Protect"):**
   - **NO presiones "Entendido"** (eso cancela la instalación).
   - Toca en **"Más detalles"** (o flecha hacia abajo).
   - Selecciona **"Instalar de todas formas"** (*Install anyway*).
3. La aplicación `frontend-mobile` se instalará y aparecerá en el menú de tus aplicaciones.

---

## 🧪 Pruebas de Notificaciones Push y Flujo Completo

### Credenciales de Acceso Docente:
- **Correo**: `teacher@test.com`
- **Contraseña**: `Password123!`

### Procedimiento de Prueba E2E:
1. **Abrir la App en el Celular:** Abre la aplicación e inicia sesión con las credenciales anteriores.
2. **Aceptar Permisos:** Cuando el sistema operativo solicite *"¿Permitir que Skylearn envíe notificaciones?"*, presiona **Permitir**.
3. **Verificación de Registro:** En el pie de página de la app, el indicador mostrará: `Push Token registrado en el backend`.
4. **Prueba Inmediata (Local):** Pulsa el botón **"🔔 Probar Notificación"** dentro de la app móvil para confirmar el canal de sonido y vibración.
5. **Prueba Real Remota (Inscripción de Estudiante):**
   - Ve a la plataforma web ([frontend-web](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-web)).
   - Inicia sesión con un alumno (`student@test.com` / `Password123!`).
   - Inscríbete en cualquier curso creado por el docente.
   - **Resultado:** En segundos, tu teléfono celular recibirá una notificación push emergente en pantalla:
     > *"¡Nuevo Alumno Inscrito! Un estudiante se ha inscrito al curso: [Nombre del Curso]. Revisa el panel para monitorear su progreso."*

---

## 💻 Desarrollo Local Rápido (Metro / Web / Expo Go)

Para iteraciones rápidas en diseño de interfaz (UI), tipografía o estilos sin esperar compilaciones de APK:

```bash
# Iniciar servidor Metro Bundler
npm start

# Atajos en la terminal de Metro:
# Presiona 'w' -> Abre la app en el navegador web (http://localhost:8081)
# Presiona 'a' -> Abre la app en emulador Android Studio local
# Presiona 'r' -> Recarga la aplicación
```
*(Nota: En modo Expo Go o Web, las notificaciones remotas de FCM no son emitidas por las restricciones nativas de Expo Go; se utiliza el mock dev token).*

---

## 🗂️ Archivos Clave del Módulo Móvil

- [App.tsx](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-mobile/App.tsx): Dashboard docente de 3 KPIs, semáforo didáctico y receptor de eventos.
- [src/services/notifications.ts](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-mobile/src/services/notifications.ts): Registro de token FCM/Expo con el backend NestJS y canales de alta prioridad.
- [app.config.js](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-mobile/app.config.js): Inyección dinámica del archivo de credenciales de Google Services para EAS Cloud.
- [eas.json](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-mobile/eas.json): Configuración de compilación de APK autónomo y variables de entorno para la nube.
