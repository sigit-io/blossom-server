# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
ENV NODE_ENV=development
COPY ./package*.json .
COPY ./yarn.lock .
ENV NODE_ENV=development
RUN npx yarn install
COPY . .
RUN npx yarn build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
COPY ./package*.json .
COPY ./yarn.lock .
RUN npx yarn install

# Copy built source from builder
COPY --from=builder ./app/build ./build
# Copy config from builder
COPY --from=builder ./app/config.yml .
# Copy public (index.html) from builder
COPY --from=builder ./app/public ./public
RUN mkdir data

EXPOSE 3000

ENV DEBUG="blossom-server,blossom-server:*"

ENTRYPOINT [ "node", "build/index.js" ]
