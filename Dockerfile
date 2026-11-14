# syntax=docker/dockerfile:1.10
# Image web Astria untuk demo dan produksi: Next.js `output: 'standalone'` di Node, tanpa kode sumber.
# Konteks build = root workspace (butuh web/ dan ui/; alias @astria/ui menunjuk ../ui/src):
#   docker build -f web/Dockerfile -t astria/web:local .
# Daftar yang dikirim ke builder: web/Dockerfile.dockerignore. Caddy meneruskan /api/v1/* ke api; sisanya ke sini.
ARG NODE_IMAGE=node:24.22.2-bookworm-slim
ARG BUN_IMAGE=oven/bun:1.4.2-slim

FROM ${BUN_IMAGE} AS bun

FROM ${NODE_IMAGE} AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /src
COPY ui/package.json ui/bun.lock ui/
RUN --mount=type=cache,target=/root/.bun/install/cache cd ui && bun install --frozen-lockfile
COPY web/package.json web/bun.lock web/
RUN --mount=type=cache,target=/root/.bun/install/cache cd web && bun install --frozen-lockfile
COPY ui ui
COPY web web
RUN cd web && bun run build

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin astria
WORKDIR /app
# outputFileTracingRoot = root workspace, jadi server standalone ada di web/server.js.
COPY --from=build --chown=10001:10001 /src/web/.next/standalone ./
COPY --from=build --chown=10001:10001 /src/web/.next/static ./web/.next/static
COPY --from=build --chown=10001:10001 /src/web/public ./web/public
USER 10001
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.status < 500 ? 0 : 1), () => process.exit(1))"]
CMD ["node", "web/server.js"]
