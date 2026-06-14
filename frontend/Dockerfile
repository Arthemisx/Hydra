# ---- Etapa 1: build do app web (Expo export estatico) ----
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vazio => o app web usa a mesma origem (recomendado).
ARG EXPO_PUBLIC_API_BASE_URL=""
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL

RUN npx expo export --platform web --output-dir dist

# ---- Etapa 2: Caddy serve os estaticos + HTTPS + proxy /api ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
