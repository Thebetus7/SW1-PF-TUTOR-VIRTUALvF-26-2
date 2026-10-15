# Frontend Móvil - Skylearn Docente (React Native & Expo)

Aplicación d móvil orientada exclusivamente al **Docente / Creador de Contenido**, construida con **React Native (Expo SDK 57)**, **TypeScript** y componentes Skylearn. Permite monitorear el **Dashboard de 3 KPIs**, semáforo pedagógico de salud de cursos con detección de lección crítica y recepción de **notificaciones push directas** ante nuevas inscripciones de alumnos.

---

## 📋 Requisitos Previos

1. **Node.js**: v18.0.0 o superior (recomendado v20+).
2. **Backend en ejecución**: El servidor NestJS debe estar corriendo en `http://localhost:3000` (accesible en la red local o mediante IP de tu máquina para pruebas físicas).

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
