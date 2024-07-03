FROM node:alpine

WORKDIR /app

COPY / .

RUN npm install

EXPOSE 8505

ENTRYPOINT [ "npm", "run", "dev" ]
