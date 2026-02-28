import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import healthRoutes  from "./routes/healthRoutes.js"
import orderRoutes from "./routes/orderRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost', 'https://crud1.alematta.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
});

server.register(cookie);

// Register global auth middleware
server.addHook('preHandler', authMiddleware);

server.register(healthRoutes, { prefix: '/health' }); // plugin isolato plugin = funzione che riceve l'istanza fastify e ci registra sopra rotte/hook/decoratori.

server.register(orderRoutes, { prefix: '/api/orders'});

export default server;