# 🔄 06: Actualizar Producción (Zero-Downtime y Rebuild Rápido)

Cuando realices mejoras en el código del Backend o Frontend y hagas push a tu repositorio de GitHub, actualiza el servidor de producción siguiendo estos sencillos pasos.

---

## Procedimiento de Actualización

Conéctate por SSH a la máquina virtual:

```bash
ssh ubuntu@TU_IP_PUBLICA
cd skylearn-prod
```

### Paso 1: Descargar los Últimos Cambios
```bash
git pull origin main
```

### Paso 2: Recompilar y Reemplazar Contenedores
Ejecuta el comando de Docker Compose:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 🧠 ¿Qué sucede internamente?
- Docker detecta si hubo cambios en el código de `backend` o `frontend-web`.
- Si hubo cambios, recompila únicamente las capas modificadas aprovechando el caché.
- Detiene los contenedores viejos y arranca los nuevos sin afectar los datos de PostgreSQL, ya que los datos están seguros en el volumen persistente `pgdata_prod`.
- El backend ejecuta automáticamente `prisma db push` para aplicar cualquier nuevo modelo o campo en la base de datos.

---

## Verificación Post-Actualización

Comprueba los logs del backend para asegurar un inicio limpio:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

Y limpia imágenes antiguas huérfanas para ahorrar espacio en disco:

```bash
docker image prune -f
```

