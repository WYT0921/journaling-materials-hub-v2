FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY config.json ./config.json
COPY src ./src
RUN mkdir -p /data/runs && chown -R node:node /app /data
USER node
ENV TZ=Asia/Shanghai NODE_ENV=production COLLECTOR_DATA_DIR=/data
CMD ["npm", "run", "scheduled"]
