# backend/Dockerfile
# Etapa 1: Dependencias y Compilación
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Instalar dependencias necesarias para compilar módulos nativos (ej. bcrypt) y OpenSSL para Prisma
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generar cliente de Prisma y compilar NestJS
RUN npx prisma generate
RUN npm run build

# Etapa 2: Imagen Final Limpia para Producción
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Prisma en Alpine requiere OpenSSL y dumb-init para señales POSIX
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Copiar script de arranque automatizado (espera Postgres, migra esquema y siembra datos si RUN_SEED=true)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Crear usuario sin privilegios para seguridad
USER node

# Copiar archivos compilados y dependencias necesarias desde la etapa builder
COPY --chown=node:node --from=builder /usr/src/app/package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# dumb-init gestiona señales Unix adecuadamente y llama al entrypoint
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
