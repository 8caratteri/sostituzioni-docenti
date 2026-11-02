# CPIA sostituzioni — Docker per Fly.io (ams) / Railway
# Volume SQLite: montare /data e SQLITE_PATH=/data/sostituzioni.sqlite
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV SQLITE_PATH=/data/sostituzioni.sqlite

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Root: i volume Fly su /data sono root-owned; serve scrittura SQLite.
# Se il mount manca, meglio fallire in modo chiaro a runtime (SQLITE_PATH).
RUN mkdir -p /data
EXPOSE 3000
# next start legge PORT; HOSTNAME=0.0.0.0 è obbligatorio in container
CMD ["npm", "start"]
