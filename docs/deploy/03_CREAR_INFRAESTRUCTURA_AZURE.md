# ☁️ 03: Crear Infraestructura en Azure (Azure CLI para Máquina Virtual Docker)

Este documento complementa la guía visual del Portal (`01_PASO_A_PASO_AZURE_PORTAL_INTERFAZ.md`) proporcionando los comandos equivalentes en **Azure CLI (PowerShell / Bash)** para aprovisionar la Máquina Virtual Linux que hospedará el stack Docker completo.

---

## 1. Inicio de Sesión y Selección de Suscripción

Abre tu terminal en tu computadora (PowerShell o Bash):

```powershell
# 1. Iniciar sesión interactiva en Azure en el navegador
az login

# 2. Listar suscripciones y verificar tu cuenta con créditos de $200 USD
az account list --output table

# 3. Seleccionar la suscripción activa
az account set --subscription "TU_SUBSCRIPTION_ID_O_NOMBRE"
```

---

## 2. Variables de Configuración

Define las variables para reutilizarlas en los comandos:

```powershell
$RG = "rg-skylearn-prod"
$LOCATION = "eastus"
$VM_NAME = "vm-skylearn-prod"
$ADMIN_USER = "azureuser"
$VM_SIZE = "Standard_B2s"   # 2 vCPU, 4 GiB RAM (~$25/mes) o Standard_B1ms (~$15/mes)
```

---

## 3. Aprovisionamiento con Azure CLI

### A. Crear el Grupo de Recursos
```powershell
az group create --name $RG --location $LOCATION
```

### B. Crear la Máquina Virtual Ubuntu con Puertos 80 y 22 Abiertos
```powershell
az vm create `
  --resource-group $RG `
  --name $VM_NAME `
  --image Ubuntu2204 `
  --size $VM_SIZE `
  --admin-username $ADMIN_USER `
  --generate-ssh-keys `
  --public-ip-sku Standard `
  --open-ports 80 22
```

*(Si prefieres autenticación por contraseña en lugar de llave SSH, agrega `--admin-password "TuPasswordSegura2026!"` en vez de `--generate-ssh-keys`)*.

### C. Obtener la Dirección IP Pública
```powershell
az vm list-ip-addresses --resource-group $RG --name $VM_NAME --output table
```

---

## 4. Conectarte a la Máquina Virtual

```powershell
ssh azureuser@<IP_PUBLICA_OBTENIDA>
```

Una vez dentro, continúa con la instalación de Docker y la ejecución de Docker Compose como se describe en `04_INSTALAR_HERRAMIENTAS.md` y `05_DESPLEGAR_Y_VERIFICAR.md`.
