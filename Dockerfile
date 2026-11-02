# CPIA sostituzioni — Next.js 15 + SQLite (Fly ams / Railway)
# IMPORTANTE: usare QUESTO file. Il Dockerfile generato da `fly launch`
# (Node template con /app/dbsetup.js) è SBAGLIATO per questa app.
#
# Volume: montare /data ; SQLITE_PATH=/data/sostituzioni.sqlite
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

# Nessun dbsetup.js — avvio solo Next.
RUN mkdir -p /data \
  && test ! -e /app/dbsetup.js

EXPOSE 3000
# Explicit: bind 0.0.0.0 (richiesto dal proxy Fly). Niente shell npm script.
CMD ["./node_modules/.bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
