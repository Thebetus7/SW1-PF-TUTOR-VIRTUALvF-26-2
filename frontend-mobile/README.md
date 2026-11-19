# Frontend Móvil - Skylearn Docente (React Native & Expo)

Aplicación d móvil orientada exclusivamente al **Docente / Creador de Contenido**, construida con **React Native (Expo SDK 57)**, **TypeScript** y componentes Skylearn. Permite monitorear el **Dashboard de 3 KPIs**, semáforo pedagógico de salud de cursos con detección de lección crítica y recepción de **notificaciones push directas** ante nuevas inscripciones de alumnos.

---

## 📋 Requisitos Previos

1. **Node.js**: v18.0.0 o superior (recomendado v20+).
2. **Backend en ejecución**: El servidor NestJS debe estar corriendo en `http://localhost:3000` (accesible en la red local o mediante IP de tu máquina para pruebas físicas).

En un teléfono físico, configura antes de iniciar Expo `EXPO_PUBLIC_API_URL` con la dirección accesible del backend, por ejemplo `http://192.168.1.10:3000/api/v1`; `localhost` en el teléfono no apunta a la computadora. En PowerShell: `$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:3000/api/v1"`. Inicia sesión con una cuenta docente. Para push remoto se necesita un proyecto Expo/EAS configurado, credenciales de notificación de Android/iOS y una compilación compatible instalada en un dispositivo; el backend debe poder acceder a `https://exp.host`. La app informa si no consigue registrar el dispositivo.

---

## 🚀 Comandos para Levantar el Frontend Móvil

### 1. Desde esta carpeta (`frontend-mobile/`)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo de Expo (Metro Bundler)
npm start
# o también:
npx expo start
```

### 2. O desde la raíz del repositorio principal

```bash
npm run dev:mobile
```

---

## 📱 ¿Cómo Visualizar la Aplicación Móvil?

Al ejecutar `npx expo start`, Metro Bundler mostrará un menú interactivo y un código QR en la terminal. Puedes abrir la app de cualquiera de las siguientes formas:

### Opción A: En tu navegador web (La más rápida y directa)
- Presiona la tecla **`w`** en la terminal donde corre Expo.
- O ejecuta directamente:
  ```bash
  npm run web
  ```
- Se abrirá en tu navegador en [http://localhost:8081](http://localhost:8081).
- *(Consejo)*: Presiona `F12` en el navegador y activa la vista de emulación de dispositivo móvil en las DevTools para verlo en formato de pantalla de teléfono.

### Opción B: En tu teléfono celular real con Expo Go (Recomendado)
1. Instala la app gratuita **Expo Go** en tu smartphone:
   - **Android**: Desde Google Play Store.
   - **iOS**: Desde App Store.
2. Conecta tu celular a la **misma red Wi-Fi** que tu computadora.
3. Abre Expo Go:
   - En Android: Presiona **"Scan QR code"** y escanea el código QR de la terminal.
   - En iOS: Abre la app **Cámara** nativa de tu iPhone, enfoca el código QR y toca el banner amarillo para abrir en Expo Go.

### Opción C: En un Emulador de Android Studio
1. Asegúrate de tener un emulador Android (AVD) configurado con al menos 4 GB de almacenamiento interno libre.
2. Con el emulador encendido, presiona la tecla **`a`** en la terminal donde corre Expo.
- O ejecuta directamente:
  ```bash
  npm run android
  ```

---

## 📦 Compilación del APK Independiente (`app-debug.apk` como en Flutter)

Para generar un archivo **`.apk` instalable y funcional de forma 100% independiente** en cualquier teléfono o emulador Android (el equivalente directo a `flutter build apk --debug` de Flutter, sin necesidad de tener Metro Bundler ni la computadora corriendo):

### Requisitos Previos:
- **Android SDK / Android Studio** instalado (con variable `ANDROID_HOME` o `ANDROID_SDK_ROOT`).
- **Java JDK 17** instalado y configurado en `JAVA_HOME`.

### Comandos en Bash:

```bash
# 1. Posicionarse en la carpeta frontend-mobile
cd frontend-mobile

# 2. Configurar la URL de tu backend en el archivo .env para que el APK sepa a dónde consultar:
# (Ejemplo para red local o IP pública de tu servidor)
echo "EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1" > .env

# 3. Generar la estructura nativa limpia de Android con Expo Prebuild
npx expo prebuild --platform android --clean

# 4. Compilar el APK en modo Debug con Gradle
cd android
./gradlew assembleDebug
```

### 📍 Ubicación del APK Generado:
Al terminar la compilación con éxito, el archivo binario independiente queda en:
```text
frontend-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### 📲 Instalación y Ejecución en Teléfono Android:
Conecta tu celular Android por cable USB (con depuración USB habilitada) y ejecuta:
```bash
# Instalar directamente en el dispositivo conectado
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
*También puedes transferir directamente el archivo `app-debug.apk` a tu teléfono vía cable USB, WhatsApp o Google Drive e instalarlo directamente.*

---

## ⌨️ Atajos Útiles en la Terminal de Expo

| Tecla | Acción |
| :---: | :--- |
| **`w`** | Abre o recarga la app en el navegador web. |
| **`a`** | Abre la app en el emulador de Android conectado. |
| **`r`** | Recarga la app en el dispositivo (*Reload*). |
| **`m`** | Abre el menú de desarrollador en el dispositivo. |
| **`Ctrl + C`** | Detiene el servidor de Expo. |

---

## 🔑 Cuenta Demo para el Móvil

Inicia sesión con la cuenta de docente para visualizar los KPIs y el semáforo didáctico:

- **Correo**: `teacher@test.com`
- **Contraseña**: `Password123!`
