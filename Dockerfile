FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
