# syntax=docker/dockerfile:1.4   # BuildKit 캐시 사용 (Render 기본 활성화)

# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Install **all** dependencies (dev + prod) for TypeScript compilation
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci          # <-- no --only=production

# Copy source code and build
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
# Install only production dependencies for runtime
COPY package*.json ./
RUN npm ci --only=production

EXPOSE 3000
CMD ["node", "dist/app.js"]