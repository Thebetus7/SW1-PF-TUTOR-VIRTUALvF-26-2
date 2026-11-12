# 🛠️ 04: Instalar Herramientas (Docker & Docker Compose con Sudo en Ubuntu)

Para ejecutar el proyecto en el servidor de producción, la Máquina Virtual Linux solo necesita tener instalados **Git** y **Docker con Docker Compose**.

---

## 1. Dentro de la Máquina Virtual Linux (Azure VM)

Conéctate por SSH a tu servidor:
```bash
ssh ubuntu@TU_IP_PUBLICA
```

Y ejecuta estos comandos para instalar Docker y Docker Compose directamente con `sudo`:

```bash
# 1. Reparar cualquier proceso de paquetes pendiente si se interrumpió
sudo dpkg --configure -a

# 2. Actualizar repositorios e instalar Git, Docker y Docker Compose
sudo apt update && sudo apt install -y git curl docker.io docker-compose-v2

# 3. Comprobar instalación exitosa con sudo
sudo docker --version
sudo docker compose version
```

Deberías ver una salida similar a:
```text
Docker version 24.x.x (o 26.x.x / 27.x.x)
Docker Compose version v2.x.x
```

---

## 2. En tu Computadora Personal (Desarrollador)

Para administrar la máquina virtual no necesitas instalar nada complejo:
- **Windows:** Puedes usar **PowerShell**, **Windows Terminal** o el cliente SSH nativo que viene integrado en Windows 10/11 (`ssh`).
- **Navegador Web:** Puedes usar Google Chrome, Microsoft Edge, Safari o Firefox para verificar la aplicación en `http://TU_IP_PUBLICA/`.
