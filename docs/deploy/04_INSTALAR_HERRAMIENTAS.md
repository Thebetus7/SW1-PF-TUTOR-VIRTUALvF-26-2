# 🛠️ 04: Instalar Herramientas (Docker & Docker Compose en Linux)

Para ejecutar el proyecto en el servidor de producción, la Máquina Virtual Linux solo necesita tener instalados **Git** y **Docker con Docker Compose**.

---

## 1. Dentro de la Máquina Virtual Linux (Azure VM)

Conéctate por SSH a tu servidor:
```bash
ssh ubuntu@TU_IP_PUBLICA
```

Y ejecuta estos comandos para instalar Docker mediante el script oficial de Docker:

```bash
# 1. Actualizar repositorios e instalar Git
sudo apt-get update -y && sudo apt-get install -y git curl

# 2. Instalar Docker Engine y Docker Compose v2 de forma automática
curl -fsSL https://get.docker.com | sudo sh

# 3. Dar permisos al usuario actual para usar Docker sin necesidad de escribir 'sudo'
sudo usermod -aG docker $USER

# 4. Refrescar los grupos de usuario
newgrp docker

# 5. Comprobar instalación exitosa
docker --version
docker compose version
```

Deberías ver una salida similar a:
```text
Docker version 27.x.x, build ...
Docker Compose version v2.x.x
```

---

## 2. En tu Computadora Personal (Desarrollador)

Para administrar la máquina virtual no necesitas instalar nada complejo:
- **Windows:** Puedes usar **PowerShell**, **Windows Terminal** o el cliente SSH nativo que viene integrado en Windows 10/11 (`ssh`).
- **Navegador Web:** Puedes usar Google Chrome, Microsoft Edge, Safari o Firefox para verificar la aplicación en `http://TU_IP_PUBLICA/`.

