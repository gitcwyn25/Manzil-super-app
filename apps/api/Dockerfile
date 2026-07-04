# Manzil API — NestJS + Prisma (monorepo-aware).
# Build context must be the REPO ROOT:
#   docker build -f apps/api/Dockerfile .

FROM node:22-alpine AS builder
WORKDIR /repo

# Install workspace dependencies with the root lockfile.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

# Sources
COPY tsconfig.base.json tsconfig.json ./
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api

# Prisma client + shared package + API build
RUN npx prisma generate --schema packages/db/schema.prisma \
  && npm run build --workspace @manzil/shared --if-present \
  && npm run build --workspace @manzil/api

# ---------- Runtime ----------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=builder /repo/node_modules node_modules
COPY --from=builder /repo/packages packages
COPY --from=builder /repo/apps/api/node_modules apps/api/node_modules
COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/apps/api/package.json apps/api/package.json

EXPOSE 4000
USER node
CMD ["node", "apps/api/dist/main.js"]
