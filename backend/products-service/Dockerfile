#############
#build stage#
#############
FROM node:22.17.1-alpine3.21 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3020

CMD ["node", "products.js"]