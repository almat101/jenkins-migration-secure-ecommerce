#build stage#

FROM node:22.17.1-alpine3.21 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

#production stage#

FROM nginx:1.29.0-alpine-slim 

RUN apk update && apk add --no-cache curl vim sudo iproute2

COPY --from=build /app/build /usr/share/nginx/html

COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]