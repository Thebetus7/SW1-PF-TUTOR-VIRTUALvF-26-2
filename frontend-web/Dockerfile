# Stage 1: Compilar la aplicación React con Vite
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_TUTOR_VRM_MALE_URL
ARG VITE_TUTOR_VRM_FEMALE_URL
ENV VITE_TUTOR_VRM_MALE_URL=$VITE_TUTOR_VRM_MALE_URL
ENV VITE_TUTOR_VRM_FEMALE_URL=$VITE_TUTOR_VRM_FEMALE_URL
RUN npm run build

# Stage 2: Servidor Nginx ultra-ligero para producción
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

