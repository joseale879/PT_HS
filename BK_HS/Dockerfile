FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN mkdir -p /app/storage/reports && chown -R node:node /app/storage

ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.js"]
