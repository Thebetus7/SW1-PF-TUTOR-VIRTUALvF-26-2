# 🐳 02: Configuración de Contenedores Docker y Proyecto

Este documento detalla la arquitectura de contenedores del proyecto:
1. **PostgreSQL 16 Alpine:** Base de datos relacional con volumen persistente.
2. **Backend (NestJS + Prisma):** Contenedor con auto-espera de base de datos, sincronización de esquema (`prisma db push`) y siembra de datos (`RUN_SEED`).
3. **Frontend Web (React + Vite + Nginx):** Contenedor multi-stage servido por Nginx actuando como **Reverse Proxy unificado en puerto 80**.
*(Nota: `frontend-mobile` no se despliega en el servidor ya que es una app cliente externa ejecutada por los docentes en sus dispositivos).*

---

## 1. Dockerfile del Backend (`backend/Dockerfile`)

Ubicado en [backend/Dockerfile](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/backend/Dockerfile):
- **Estrategia:** Multi-stage build con Node.js 22 LTS Alpine.
- **Seguridad:** Incluye `openssl` (requerido por el motor de Prisma) y `dumb-init` para control de señales Unix.
- **Script de Inicialización (`docker-entrypoint.sh`):**
  - Espera activamente a que el contenedor de PostgreSQL acepte conexiones.
  - Ejecuta la sincronización del esquema con Prisma.
  - Si la variable `RUN_SEED=true`, ejecuta el seed idempotente con los usuarios de prueba (`student@test.com`, `teacher@test.com`) y cursos iniciales.
  - Arranca la aplicación NestJS en el puerto interno 3000.

```dockerfile
# backend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++ openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
RUN apk add --no-cache openssl dumb-init
ENV NODE_ENV=production
ENV PORT=3000
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER node
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
```

---

## 2. Dockerfile del Frontend Web (`frontend-web/Dockerfile`)

Ubicado en [frontend-web/Dockerfile](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/frontend-web/Dockerfile):
- **Stage 1 (Builder):** Compila el código TypeScript / React con Vite generando los assets optimizados en `/dist`.
- **Stage 2 (Runner):** Copia los archivos estáticos en Nginx Alpine y aplica la configuración de proxy inverso.

```dockerfile
# frontend-web/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración del Reverse Proxy (`frontend-web/nginx.conf`)
Unifica el Frontend y el Backend en el puerto 80 sin problemas de CORS ni requerir URLs fijas en tiempo de compilación:

```nginx
server {
    listen 80;
    server_name localhost;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Entrega la SPA de React con fallback a index.html
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso unificado hacia el contenedor de Backend NestJS
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Caché estática para assets de Vite
    location /assets/ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 3. Orquestador Docker Compose (`docker-compose.prod.yml`)

Ubicado en la raíz del proyecto [docker-compose.prod.yml](file:///c:/EDBERTO/ULTIMO/SW1/PROYECTO%20FINAL/SW1-PF-TUTOR-VIRTUALvF-26-2/docker-compose.prod.yml):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: skylearn-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-skylearn_admin}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-securepassword123}
      POSTGRES_DB: ${DB_NAME:-skylearn_db}
    volumes:
      - pgdata_prod:/var/lib/postgresql/data
    networks:
      - skylearn-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: skylearn-backend-prod
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      PORT: 3000
      DATABASE_URL: "postgresql://${DB_USER:-skylearn_admin}:${DB_PASSWORD:-securepassword123}@postgres:5432/${DB_NAME:-skylearn_db}?schema=public"
      JWT_SECRET: ${JWT_SECRET:-clave_secreta_jwt_demo_para_pruebas_locales_123}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
      GEMINI_API_KEY: ${GEMINI_API_KEY:-demo_key}
      GEMINI_DEFAULT_MODEL: ${GEMINI_DEFAULT_MODEL:-gemini-2.5-flash}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-mock}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-mock}
      RUN_SEED: ${RUN_SEED:-true}
    networks:
      - skylearn-network

  frontend:
    build:
      context: ./frontend-web
      dockerfile: Dockerfile
    container_name: skylearn-frontend-prod
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - skylearn-network

volumes:
  pgdata_prod:
    driver: local

networks:
  skylearn-network:
    driver: bridge
```

---

## 4. Ejecución en un Solo Comando

Para levantar absolutamente todo el ecosistema en el servidor:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Y para verificar el estado de los 3 contenedores:
```bash
docker compose -f docker-compose.prod.yml ps
```

