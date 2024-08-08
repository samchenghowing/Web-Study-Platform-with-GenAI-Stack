# node.Dockerfile
FROM node:20

WORKDIR /app

RUN npm install eslint

COPY . .

CMD ["node", "test.js"]
