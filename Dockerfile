# ---- 1. Frontend build (Vite → static dist) ----
FROM mirror.houlang.cloud/dh/library/node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN sed -i 's#https://registry.npmjs.org#https://registry.npmmirror.com#g' package-lock.json && npm ci
COPY tsconfig.json tsconfig.app.json tsconfig.node.json index.html vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- 2. Backend production deps ----
FROM mirror.houlang.cloud/dh/library/node:22-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN sed -i 's#https://registry.npmjs.org#https://registry.npmmirror.com#g' package-lock.json && npm ci --omit=dev

# ---- 3. Runtime: one Node process serves dist + /api ----
FROM mirror.houlang.cloud/dh/library/node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/package.json ./package.json
COPY backend/src ./src
COPY backend/config ./config
COPY --from=frontend /app/dist ./public
ENV PORT=8088 \
    STATIC_DIR=/app/public \
    HOST_PROC=/host/proc \
    HOST_SYS=/host/sys \
    HOST_FS=/hostfs
EXPOSE 8088
CMD ["node", "--import", "tsx", "src/index.ts"]
