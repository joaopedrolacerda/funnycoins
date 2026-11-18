# Site em produção: gera os arquivos estáticos e serve com o Caddy.
# O Railway usa este arquivo pelo railway.json. As variáveis estão em "Publicar" na CLAUDE.md.

# 1. Build (o WASM das regras já vem pronto em src/lib/rules/pkg)
FROM node:24-bookworm-slim AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
# Variáveis do Vite entram no build. O Railway repassa as variáveis do serviço como ARG.
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_DEV_LOGIN
RUN npm run build

# 2. Servidor estático
FROM caddy:2.10-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /web/dist /srv
EXPOSE 8080
