# Build context = repository root (см. docker-compose: context: .)
# Это нужно, чтобы образ видел общий пакет shared/ рядом с server/.
FROM node:20-alpine AS build
WORKDIR /app
COPY server/package*.json server/tsconfig.json ./server/
RUN cd server && npm install
COPY server/src ./server/src
COPY shared ./shared
RUN cd server && npm run build

FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/server/dist ./dist
EXPOSE 4000
# rootDir=.. → структура сохраняется: dist/server/src/index.js
CMD ["node", "dist/server/src/index.js"]
