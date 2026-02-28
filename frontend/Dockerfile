# ── Stage 1: Build ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL 讓前端在 build time 知道後端在哪
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Production (nginx) ───────────────────────────
FROM nginx:1.27-alpine AS production

# 複製 nginx 設定（/api 反向代理到後端）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 複製 Vite build 產物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
