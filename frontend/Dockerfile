# ---- Etapa 1: build do app web (Expo export estatico) ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vazio => o app web usa a mesma origem e o proxy /api do nginx (recomendado).
# Defina uma URL completa (ex.: https://api.seudominio.com) para apontar para outro host.
ARG EXPO_PUBLIC_API_BASE_URL=""
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL

RUN npx expo export --platform web --output-dir dist

# ---- Etapa 2: imagem final servindo os estaticos + proxy da API ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
