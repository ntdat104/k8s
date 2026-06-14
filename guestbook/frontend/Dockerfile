# ============================================================
# Frontend Dockerfile - multi-stage build
#   Stage 1 (build): cai dep + build React thanh static files
#   Stage 2 (run):   nginx serve static + proxy /api -> backend
# Ket qua: image cuoi rat nho, khong chua node_modules / source
# ============================================================

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
# Output build nam o /app/dist

# ---------- Stage 2: serve bang nginx ----------
FROM nginx:1.27-alpine

# Config nginx (serve SPA + proxy /api sang backend-service noi bo K8s)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files da build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
