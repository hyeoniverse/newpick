# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema=prisma/mysql.schema.prisma \
  && npm run build \
  && npm prune --omit=dev

# ---- runtime ----
FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=3001

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

USER node
EXPOSE 3001

# 시작할 때 아직 적용되지 않은 migration을 적용한 뒤 서버를 띄웁니다.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/mysql.schema.prisma && node dist/src/main"]
