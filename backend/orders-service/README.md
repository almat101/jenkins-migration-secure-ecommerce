# Project Architecture

This service follows a layered architecture similar to MVC, adapted for Fastify:

```
src/
├── app.ts              # Fastify app configuration (plugins, hooks, routes registration)
├── server.ts           # Server startup (separated for testing)
├── routes/             # ROUTES (replaces Controllers in Fastify)
│   ├── orderRoutes.ts  # HTTP endpoints, request validation, calls services
│   └── healthRoutes.ts # Health check endpoints
├── services/           # SERVICES (Business Logic)
│   └── orderService.ts # Business logic, transactions, Redis publishing
├── db/                 # DATABASE (acts as Repository)
│   ├── index.ts        # Drizzle client
│   └── schema.ts       # Drizzle schema (orders, orderItems tables)
├── middleware/         # MIDDLEWARE (Hooks)
│   └── authMiddleware.ts # JWT authentication hook
├── types/              # TypeScript interfaces
│   └── orderInterfaces.ts # IOrderBody, IOrderItem, FastifyRequest augmentation
├── redis/              # Redis client
│   └── redisClient.ts  # Redis connection
└── consumers/          # Event consumers (for Redis Streams)
```

### Layer Responsibilities

| Layer | Fastify Equivalent | Responsibility |
|-------|-------------------|----------------|
| **Routes** | Controller | HTTP handling, validation, request/response |
| **Services** | Service | Business logic, transactions, external calls |
| **DB** | Repository | Database operations with Drizzle ORM |
| **Middleware** | Hooks | Cross-cutting concerns (auth, logging) |

### Request Flow

```
Request → Middleware (authMiddleware) → Route (orderRoutes) → Service (orderService) → DB/Redis → Response
```

---

# Orders Service — Setup Summary

- **Project type:** TypeScript-only Fastify service.
- **Runtime library:** `fastify` is installed as a production dependency.
- **Dev tooling:** `typescript` and `ts-node-dev` are used for compilation and fast-reload during development.
- **ES modules:** `"type": "module"` is enabled in `package.json` (use ESM imports/exports).

```sh
npm init -y
npm i fastify
npm i -D typescript @types/node tsx
```

**Scripts**
- `npm run dev` — runs `tsx watch src/server.ts` runs and auto-restarts on file changes
- `npm run build` — compiles TypeScript (`tsc`) according to `tsconfig.json` into `dist/`.
- `npm run start` — runs the compiled JS at `dist/server.js` in production.

**Required files / layout**
- `tsconfig.json` — ensure `rootDir: "src"` and `outDir: "dist"`.
- `src/server.ts` — entry point for the service.
- After `npm run build`: `dist/server.js` should exist and be runnable.

**How to run**
- Development: `npm run dev`
- Production: `npm run build && npm run start`

---


# Redis-cli comandi utili

docker exec -it <redis_container_name> redis-cli

## Vedere TUTTI i messaggi dallo stream (dall'inizio)
XREAD STREAMS orders_stream 0

## Vedere solo i messaggi con un range specifico
XRANGE orders_stream - +

## Vedere gli ultimi N messaggi
XREVRANGE orders_stream + - COUNT 5

## Vedere info sullo stream (lunghezza, primo/ultimo messaggio, ecc.)
XINFO STREAM orders_stream