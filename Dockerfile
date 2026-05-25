# syntax=docker/dockerfile:1.6
#
# net-monitor — multi-arch image (linux/amd64, linux/arm64, linux/arm/v7)
#
# Build locally on your Pi:
#   docker build -t net-monitor .
#
# Or multi-arch with buildx (from any machine):
#   docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 \
#     -t your-user/net-monitor:latest --push .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data
WORKDIR /app

# android-tools provides the `adb` binary needed for Shield (ADB over TCP/IP) checks.
# Available in Alpine community repo for amd64 and arm64.
RUN apk add --no-cache android-tools

# Drop privileges. The `node` user already exists in the base image.
# /home/node/.android holds the ADB RSA key pair — mounted as a volume so
# the Shield only needs to confirm the fingerprint once across rebuilds.
RUN mkdir -p /data /home/node/.android && chown -R node:node /data /home/node/.android

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node server ./server
COPY --chown=node:node public ./public
COPY --chown=node:node package.json ./

USER node
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/index.js"]
