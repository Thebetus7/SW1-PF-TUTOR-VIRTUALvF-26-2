# ⏸️ 07: Apagar y Reactivar para Maximizar los Créditos ($200 USD)

Microsoft Azure cobra el cómputo de la Máquina Virtual por cada segundo que está en estado `En ejecución`.  
Para que tus **$200 USD de crédito te duren muchos meses**, puedes detener la máquina virtual durante la noche o cuando no estés realizando demostraciones.

---

## 1. Cómo Apagar la Máquina Virtual (Deallocate)

> [!IMPORTANT]  
> Al apagar la VM mediante **Detener** (Desasignar), el costo de CPU y RAM pasa a ser **$0.00 USD/hora**. Solo se paga una cantidad insignificante por el almacenamiento del disco SSD (~$1-$2 al mes).

### Opción A: Desde Azure Portal (Interfaz Gráfica)
1. Entra a [portal.azure.com](https://portal.azure.com).
2. Entra a tu máquina virtual: **`vm-skylearn-prod`**.
3. En la barra superior, haz clic en el botón **`Detener`** (Stop).
4. Confirma cuando te pregunte si deseas desasignar la dirección IP. El estado cambiará a: **Detenido (desasignado)**.

### Opción B: Desde tu Computadora con Azure CLI
```powershell
az vm deallocate --resource-group rg-skylearn-prod --name vm-skylearn-prod
```

---

## 2. Cómo Reactivar la Máquina Virtual

Al volver a encender la máquina virtual, **no necesitas ejecutar ningún comando de Docker**: gracias a la directiva `restart: unless-stopped` configurada en `docker-compose.prod.yml`, Docker levantará automáticamente PostgreSQL, Backend y Frontend en cuanto el sistema operativo arranque.

### Opción A: Desde Azure Portal
1. Entra a tu máquina virtual: **`vm-skylearn-prod`**.
2. En la barra superior, haz clic en el botón **`Iniciar`** (Start).
3. Espera 30 segundos y verifica la IP pública. Abre `http://TU_IP_PUBLICA/` en tu navegador.

### Opción B: Desde tu Computadora con Azure CLI
```powershell
az vm start --resource-group rg-skylearn-prod --name vm-skylearn-prod
```

---

## 3. Configurar Apagado Automático Programado (Auto-Shutdown)

Azure Portal te permite configurar una regla para que la máquina virtual se apague automáticamente todos los días a cierta hora (por ejemplo, a las 20:00 o 22:00) para evitar olvidos accidentales:

1. Entra a tu máquina virtual **`vm-skylearn-prod`** en Azure Portal.
2. En el menú lateral izquierdo, bajo la sección **Operaciones** (Operations), haz clic en **Apagado automático** (Auto-shutdown).
3. Activa el interruptor en **Habilitado**.
4. Selecciona la hora (ej. `21:00:00`) y tu zona horaria local.
5. Haz clic en **Guardar**.
