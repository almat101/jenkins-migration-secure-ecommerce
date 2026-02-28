# build stage
FROM node:22.17.1-alpine3.21 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Drizzle migrations from schema
RUN npm run drizzle:generate

# Build TypeScript to JavaScript
RUN npm run build

# Prod stage
FROM node:22.17.1-alpine3.21

WORKDIR /app

COPY package*.json ./

RUN npm install 
# removed --production to run npm run dev ( need the installation of tsx and ts)
# RUN npm install --production


# Copy built files and migrations
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/src ./src

EXPOSE 3040

# Run migrations then start server 
CMD ["sh", "-c", "npm run drizzle:migrate && npm run start"]