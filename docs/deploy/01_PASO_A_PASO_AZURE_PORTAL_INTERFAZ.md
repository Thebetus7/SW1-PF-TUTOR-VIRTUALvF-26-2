# 🧭 01: Guía Visual para Principiantes — Cómo Moverte en Azure Portal Paso a Paso (Stack Dockerizado Integral)

> Si es la **primera vez que abres Microsoft Azure**, esta guía te llevará de la mano haciendo clic en cada botón exacto de la pantalla sin perderte.  
> Todo el ecosistema de producción (**PostgreSQL**, **Backend NestJS** y **Frontend Web React**) corre dockerizado de forma integral dentro de una **Máquina Virtual Linux en Azure**; la app móvil (`frontend-mobile`) no se despliega en el servidor ya que es un cliente móvil que los usuarios ejecutan en sus teléfonos.

---

## 🗺️ Índice de este Módulo
1. [Paso 1: Iniciar Sesión y Conocer la Pantalla Principal](#paso-1-iniciar-sesión-y-conocer-la-pantalla-principal)
2. [Paso 2: Crear el Grupo de Recursos (Carpeta Contenedora)](#paso-2-crear-el-grupo-de-recursos-carpeta-contenedora)
3. [Paso 3: Crear la Máquina Virtual Linux en Azure Portal](#paso-3-crear-la-máquina-virtual-linux-en-azure-portal)
4. [Paso 4: Conectarte por SSH a la Máquina Virtual](#paso-4-conectarte-por-ssh-a-la-máquina-virtual)
5. [Paso 5: Instalar Docker y Docker Compose en 1 Solo Comando](#paso-5-instalar-docker-y-docker-compose-en-1-solo-comando)
6. [Paso 6: Clonar el Proyecto y Levantar Todo el Stack en Producción](#paso-6-clonar-el-proyecto-y-levantar-todo-el-stack-en-producción)
7. [Paso 7: Verificar el Sistema en tu Navegador](#paso-7-verificar-el-sistema-en-tu-navegador)

---

## Paso 1: Iniciar Sesión y Conocer la Pantalla Principal

1. Abre tu navegador web y entra a: **[https://portal.azure.com](https://portal.azure.com)**
2. Inicia sesión con la cuenta de correo donde tienes asignados los **$200 USD de crédito**.
3. Al entrar verás la barra superior azul oscura y el encabezado **"Servicios de Azure"**.
4. **Elementos clave que siempre usarás en la pantalla:**
   - 🔍 **Barra de búsqueda central superior:** Es el buscador universal de Azure. Si buscas algo (ej. "Máquinas virtuales"), escríbelo directamente allí.
   - ☰ **Menú hamburguesa (arriba a la izquierda):** Despliega el menú lateral con acceso rápido a todos los recursos.
   - 🔔 **Icono de Campana (arriba a la derecha):** Muestra las notificaciones en tiempo real cuando un recurso se está creando o ya terminó de crearse.

---

## Paso 2: Crear el Grupo de Recursos (Carpeta Contenedora)

Un **Grupo de Recursos** es una carpeta lógica donde agruparemos la máquina virtual, el disco de almacenamiento y la red para tener todo ordenado y controlar los créditos consumidos.

### Dónde hacer clic:
1. En la barra de búsqueda superior escribe: `Grupos de recursos` (o `Resource groups`).
2. Haz clic en el primer resultado con un icono de carpetas azules: **Grupos de recursos**.
3. En la barra superior de esa vista, haz clic en el botón **`+ Crear`** (o `+ Create`).
4. Llena el formulario con los siguientes datos:
   - **Suscripción:** Selecciona tu suscripción con crédito (ej. *Azure for Students*, *Evaluación gratuita* o *Pay-As-You-Go*).
   - **Grupo de recursos:** Escribe `rg-skylearn-prod`.
   - **Región:** Selecciona `(US) Este de EE. UU.` (East US) o `(US) Este de EE. UU. 2` (East US 2).
5. Haz clic en el botón azul inferior: **`Revisar y crear`**.
6. Espera 2 segundos a que diga "Validación superada" y haz clic en **`Crear`**.
7. Verás la notificación en la campana 🔔 indicando que el grupo fue creado.

---

## Paso 3: Crear la Máquina Virtual Linux en Azure Portal

En este servidor se ejecutará Docker Compose con los 3 contenedores: **PostgreSQL con volumen persistente**, **Backend NestJS** y **Frontend Web Nginx**.

### Dónde hacer clic:
1. En la barra de búsqueda superior escribe: `Máquinas virtuales` (o `Virtual machines`).
2. Haz clic en el servicio llamado **Máquinas virtuales**.
3. Haz clic en el botón **`+ Crear`** y selecciona **Máquina virtual de Azure** (Azure virtual machine).
4. En la pestaña **Aspectos básicos** (Basics), completa:
   - **Grupo de recursos:** Selecciona `rg-skylearn-prod`.
   - **Nombre de la máquina virtual:** `vm-skylearn-prod`.
   - **Región:** `(US) East US` (la misma que elegiste antes).
   - **Opciones de disponibilidad:** *No se requiere redundancia de la infraestructura* (para no elevar costos innecesarios).
   - **Tipo de seguridad:** *Estándar*.
   - **Imagen:** Selecciona **Ubuntu Server 24.04 LTS - x64 Gen2** (o 22.04 LTS).
   - **Arquitectura de VM:** *x64*.
   - **Tamaño:** Haz clic en *Ver todos los tamaños* y selecciona:
     - **Standard_B2s** (2 vCPU, 4 GiB de memoria RAM) — Ideal para que Docker compile y ejecute fluidamente PostgreSQL, NestJS y Nginx (~$25 USD/mes, cubierto holgadamente por tus $200 USD).
     - *(Alternativa mínima económica: Standard_B1ms con 1 vCPU y 2 GiB RAM)*.
   - **Tipo de autenticación:** 
     - Selecciona **Contraseña** (Password) para máxima facilidad:
       - **Nombre de usuario:** `ubuntu`
       - **Contraseña:** Crea una contraseña segura (ej. `Skylearn2026!UbuntuPass`) y anótala.
   - **Reglas de puertos de entrada:**
     - En *Puertos de entrada públicos*, marca **Permitir los puertos seleccionados**.
     - En *Seleccionar puertos de entrada*, marca las casillas:
       - ☑️ **SSH (22)** *(Para conectarte a la consola del servidor)*
       - ☑️ **HTTP (80)** *(Para que el mundo entero y tu navegador accedan a la aplicación web)*
5. Pestaña **Discos** (Disks):
   - Haz clic en *Siguiente: Discos*.
   - **Tipo de disco de SO:** Selecciona **SSD estándar** (o SSD Premium) de **32 GiB** o **64 GiB**.
6. Haz clic directamente en **Revisar y crear** en la parte inferior.
7. Espera a que diga "Validación superada" y haz clic en **Crear**.
8. El aprovisionamiento tarda aprox. 1 a 2 minutos. La campana 🔔 te avisará con "Implementación completada".
9. Haz clic en el botón azul **Ir al recurso**.
10. **Anota la Dirección IP pública** que aparece en el panel principal (ej. `20.120.45.67`).

---

## Paso 4: Conectarte por SSH a la Máquina Virtual

Abre tu terminal habitual en Windows (PowerShell, CMD o Windows Terminal):

```powershell
# Reemplaza ubuntu con tu usuario y la IP con la IP pública de tu VM
ssh ubuntu@20.120.45.67
```

- Escribe `yes` cuando te pregunte si confías en la huella digital del host (*fingerprint*).
- Ingresa la contraseña que definiste en el Paso 3.
- ¡Listo! Verás el prompt de bienvenida verde de Ubuntu: `ubuntu@vm-skylearn-prod:~$`.

---

## Paso 5: Instalar Docker y Docker Compose en 1 Solo Comando

Dentro de la consola de la máquina virtual, ejecuta el instalador oficial desatendido de Docker:

```bash
# 1. Descargar e instalar Docker automáticamente
curl -fsSL https://get.docker.com | sudo sh

# 2. Permitir que tu usuario ejecute comandos Docker sin sudo
sudo usermod -aG docker $USER

# 3. Aplicar los permisos al usuario actual
newgrp docker

# 4. Verificar que Docker y Docker Compose están instalados
docker --version
docker compose version
```

---

## Paso 6: Clonar el Proyecto y Levantar Todo el Stack en Producción

Dentro de la máquina virtual:

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git skylearn-app
cd skylearn-app

# 2. Crear el archivo de variables de entorno de producción
cp .env.prod.example .env

# 3. Editar las variables si deseas cambiar claves o agregar tu GEMINI_API_KEY
nano .env
# (Usa CTRL + O para guardar y CTRL + X para salir)

# 4. LEVANTAR TODO EL STACK CON UN SOLO COMANDO:
docker compose -f docker-compose.prod.yml up --build -d
```

### 🧠 ¿Qué hace este comando automáticamente en segundo plano?
1. **Inicia PostgreSQL 16 Alpine** en su propio contenedor con un volumen persistente (`pgdata_prod`) que nunca pierde datos.
2. **Compila el Backend NestJS**, espera a que PostgreSQL esté listo, ejecuta `prisma db push` para crear las tablas automáticamente y, gracias a `RUN_SEED=true`, siembra los usuarios y cursos demo oficiales.
3. **Compila el Frontend Web React con Vite**, empaqueta los archivos estáticos en un servidor Nginx ultra-rápido y abre el puerto **80**.
4. **Nginx gestiona el tráfico unificado:**
   - La raíz `/` entrega el Frontend Web.
   - Las rutas `/api/` se enrutan internamente al contenedor del Backend sin exponer puertos adicionales ni sufrir problemas de CORS.

---

## Paso 7: Verificar el Sistema en tu Navegador

Abre tu navegador web en tu computadora e ingresa a:

- 🌐 **Frontend Web (Aplicación completa):**  
  `http://TU_IP_PUBLICA/` (ej. `http://20.120.45.67`)
- 📚 **Documentación Interactiva Swagger OpenAPI:**  
  `http://TU_IP_PUBLICA/api/docs`

### Credenciales Demo Sembradas Automáticamente:
- **Estudiante Demo:**  
  - Correo: `student@test.com`  
  - Contraseña: `Password123!` (con 3 créditos iniciales para interactuar con el Tutor Virtual)
- **Docente Demo:**  
  - Correo: `teacher@test.com`  
  - Contraseña: `Password123!`

---

## 📱 ¿Y la Aplicación Móvil (`frontend-mobile`)?
La app móvil en React Native (Expo) es un **cliente móvil externo** que corre en el dispositivo físico de cada docente.
Para conectarla con este servidor de producción:
1. Abre `frontend-mobile/src/services/api.ts`.
2. Actualiza la URL base con la IP pública de tu servidor de Azure:  
   `export const API_BASE_URL = 'http://TU_IP_PUBLICA/api/v1';`
3. ¡Listo! La app móvil consumirá directamente la API pública servida por Nginx en el puerto 80 sin requerir ningún contenedor adicional en el servidor.

