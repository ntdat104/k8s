# ============================================================
# Backend Dockerfile - production-ready
# - Base image nho (alpine), chay bang user khong phai root
# - APP_VERSION truyen vao luc build de tao image v1 / v2
# ============================================================
FROM node:20-alpine

# Version cua app (override khi build: --build-arg APP_VERSION=v2)
ARG APP_VERSION=v1
ENV APP_VERSION=${APP_VERSION}
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy package truoc de tan dung cache layer khi cai dependency
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY server.js ./

# Chay bang user "node" co san trong image (khong dung root) -> bao mat
USER node

EXPOSE 8080

CMD ["node", "server.js"]
