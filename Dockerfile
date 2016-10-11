FROM node:6-slim

WORKDIR /app
COPY package.json /app/package.json

RUN npm install

EXPOSE 3000

COPY index.js /app/index.js

CMD ["node", "index.js"]
