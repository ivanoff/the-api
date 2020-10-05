FROM node:14

WORKDIR /app

COPY ./package.json .
COPY ./example.js .
COPY ./src /app/src

RUN npm install

RUN ls -la
