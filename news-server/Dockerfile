# syntax=docker/dockerfile:1.4   # BuildKit 캐시 사용 (Render 기본 활성화)

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install **all** dependencies (dev + prod) for TypeScript compilation
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy compiled output
COPY --from=builder /app/dist ./dist
# Copy source files needed by Swagger (routes, config, etc.)
COPY --from=builder /app/src ./src

# Copy python scripts
COPY --from=builder /app/news-data /news-data

# Install Python 3 and dependencies
RUN apk add --no-cache python3 py3-pip && \
    ln -sf python3 /usr/bin/python && \
    pip3 install --no-cache-dir --break-system-packages -r /news-data/requirements.txt

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

EXPOSE 3000
CMD ["node", "dist/app.js"]