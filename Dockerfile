# ---- 1. Frontend build (Vite → static dist) ----
# ARGs keep the build portable: CN mirrors are the default (fastest here);
# on an overseas server build with:
#   docker build --build-arg NODE_IMAGE=node:22-alpine --build-arg NPM_REGISTRY=https://registry.npmjs.org .
ARG NODE_IMAGE=mirror.houlang.cloud/dh/library/node:22-alpine
ARG NPM_REGISTRY=https://registry.npmmirror.com

FROM ${NODE_IMAGE} AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
ARG NPM_REGISTRY
RUN sed -i "s#https://registry.npmjs.org#${NPM_REGISTRY}#g" package-lock.json && npm ci
COPY tsconfig.json tsconfig.app.json tsconfig.node.json index.html vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

# ---- 2. Backend production deps ----
FROM ${NODE_IMAGE} AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
ARG NPM_REGISTRY
RUN sed -i "s#https://registry.npmjs.org#${NPM_REGISTRY}#g" package-lock.json && npm ci --omit=dev

# ---- 3. Runtime: one Node process serves dist + /api ----
FROM ${NODE_IMAGE} AS runtime
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
