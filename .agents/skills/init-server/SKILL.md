---
name: init-server
description: Inicia y supervisa los servidores del proyecto (Backend NestJS, Frontend Web React y Frontend Móvil Expo) con verificación de estado y puertos.
---

# Skill: init-server (Gestor de Servidores del Tutor Virtual)

Esta skill permite orquestar, iniciar y verificar los servidores de desarrollo de la plataforma educativa.

## Modos de Uso

Cuando el usuario invoque `/init-server` o pida levantar servidores, identifica qué componentes necesita:

1. **Todos los servicios (por defecto si no especifica)**: Backend + Frontend Web + Frontend Móvil.
2. **Backend**: Solo la API NestJS en puerto `3000`.
3. **Frontend Web**: Solo la aplicación web React (Vite) en puerto `5173`.
4. **Frontend Móvil**: Solo el servidor Expo para React Native en puerto `8081`.

---

## Procedimiento de Ejecución del Agente

### Paso 1: Comprobar disponibilidad de puertos
Antes de iniciar los servicios, verificar si los puertos están ocupados para no generar colisiones:
- Backend: `3000`
- Frontend Web: `5173`
- Frontend Móvil (Expo): `8081`

Comando de verificación rápida en PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3000, 5173, 8081 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess
```

### Paso 2: Ejecutar los servidores correspondientes
Lanzar los comandos con `run_command` configurando `IsDaemon: true` y `WaitMsBeforeAsync: 1000`:

#### 1. Backend NestJS
- **Comando**: `npm run start:dev` (o `npm --prefix backend run start:dev`)
- **Directorio**: Raíz del proyecto o carpeta `backend/`
- **URL esperada**: `http://localhost:3000` (API y Swagger en `http://localhost:3000/api`)

#### 2. Frontend Web (React + Vite)
- **Comando**: `npm run dev:web` (o `npm --prefix frontend-web run dev`)
- **Directorio**: Raíz del proyecto o carpeta `frontend-web/`
- **URL esperada**: `http://localhost:5173`

#### 3. Frontend Móvil (Expo)
- **Comando**: `npm run dev:mobile` (o `npm --prefix frontend-mobile run start`)
- **Directorio**: Raíz del proyecto o carpeta `frontend-mobile/`
- **URL esperada**: Metro Bundler en `http://localhost:8081`

### Paso 3: Confirmación y Enlaces al Usuario
Una vez levantados los procesos, entrega un resumen claro con:
- Estado de cada servicio (Levantado / En ejecución).
- Enlaces clickeables a `http://localhost:3000` y `http://localhost:5173`.
- Indicaciones para abrir la app móvil con Expo Go (código QR / `npx expo start`).
