# Frontend Web - Plataforma Educativa Skylearn

Aplicación cliente web desarrollada con **React 19**, **TypeScript**, **Vite** y el sistema de diseño accesible **Skylearn**. Diseñada para estudiantes (catálogo, exploración de temarios, consumo de lecciones en video, tutor 3D con Three.js y formularios evaluativos) y para docentes (gestor curricular de cursos, módulos, lecciones y exámenes).

---

## 📋 Requisitos Previos

1. **Node.js**: v18.0.0 o superior (recomendado v20+).
2. **Backend en ejecución**: El servidor de API REST debe estar corriendo en `http://localhost:3000`.

---

## 🚀 Comandos para Levantar el Frontend Web

### 1. Desde esta carpeta (`frontend-web/`)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo Vite con Hot Module Replacement (HMR)
npm run dev
```

### 2. O desde la raíz del repositorio principal

```bash
npm run dev:web
```

---

## 🌐 Visualización en el Navegador

Una vez iniciado el servidor, abre en tu navegador:

👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Comandos de Calidad y Compilación

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local en el puerto 5173. |
| `npm run build` | Compila y valida tipos (`tsc -b`) generando el bundle de producción en `dist/`. |
| `npm run preview` | Previsualiza localmente el bundle compilado de producción. |
| `npm run lint` | Ejecuta el análisis estático de código ultrarrápido con **Oxlint**. |

---

## 🧭 Navegación con Historial (Hash Routing)

La aplicación utiliza un Hash Router reactivo sincronizado con el historial del navegador (`window.history`), por lo que las flechas **Atrás / Adelante** del navegador permiten navegar naturalmente entre vistas sin abandonar la aplicación:

- `#/courses`: Catálogo público de cursos didácticos.
- `#/courses/:id`: Vista de detalle del curso, profesor, temario completo y botón de pre-inscripción.
- `#/lessons/:id`: Visor interactivo de lección con video de YouTube, Tutor Virtual 3D y examen formativo.
- `#/teacher/courses`: Panel de gestión curricular para docentes (creación de cursos y temarios).
- `#/teacher/courses/:id`: Explorador y editor de lecciones y formularios asociados a un curso.

---

## 🔑 Cuentas Demo para Probar la Plataforma

Puedes ingresar en el formulario de Login usando cualquiera de las credenciales sembradas:

- **Estudiante**: `student@test.com` / `Password123!` (cuenta con 3 créditos iniciales para abrir lecciones).
- **Docente Creador**: `teacher@test.com` / `Password123!` (acceso al panel de gestión curricular).
