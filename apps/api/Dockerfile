# 빌드 컨텍스트는 저장소 루트 (npm workspaces: 루트 package-lock.json 하나로 설치, 나중에 packages/*도 함께).
#   docker build -f apps/api/Dockerfile .
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# 설치에 필요한 것만 먼저 (소스가 바뀌어도 설치 층은 캐시). 잠금 파일이 모든 workspace를 알아야 해서 web의 package.json도
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# 공유 패키지(@newpick/shared)는 작아서 소스째 먼저 넣고 설치 뒤 바로 빌드 (api가 dist를 require)
COPY packages/shared packages/shared
RUN npm ci -w apps/api -w packages/shared && npm run build -w @newpick/shared

COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate --schema=prisma/mysql.schema.prisma \
  && npm run build \
  && cd /app && npm prune --omit=dev -w apps/api

# ---- runtime ----
FROM node:22-slim
WORKDIR /app/apps/api
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# 이미지를 만든 커밋 (GET /health의 version). CI가 sha-1a2b3c4로 넘깁니다
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    TZ=Asia/Seoul \
    PORT=3001 \
    APP_VERSION=${APP_VERSION}

# 루트 node_modules(끌어올린 패키지)와 api의 node_modules를 둘 다
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
# node_modules/@newpick/shared는 packages/shared를 가리키는 링크라 빌드한 결과를 그 자리에
COPY --from=build /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=build /app/packages/shared/dist /app/packages/shared/dist
COPY apps/api/package.json ./

USER node
EXPOSE 3001

# 시작할 때 아직 적용되지 않은 migration을 적용한 뒤 서버를 띄웁니다.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/mysql.schema.prisma && node dist/src/main"]
