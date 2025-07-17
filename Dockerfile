FROM node:22-alpine AS builder

WORKDIR /strudel
COPY . .

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install --frozen-lockfile
RUN pnpm test
RUN pnpm test-ui


FROM node:22-alpine AS runtime

WORKDIR /strudel

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /strudel/node_modules ./node_modules
COPY --from=builder /strudel . .

EXPOSE 4321
ENTRYPOINT ["pnpm", "dev"] 
