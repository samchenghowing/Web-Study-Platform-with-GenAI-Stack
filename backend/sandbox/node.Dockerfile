# node.Dockerfile
FROM node:alpine

WORKDIR /app

RUN npm install eslint

COPY . .

CMD ["node", "test.js"]
