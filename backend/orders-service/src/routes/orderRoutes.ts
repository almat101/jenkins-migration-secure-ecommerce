import type { FastifyInstance } from 'fastify';
import * as orderService from "../services/orderService.js";
import type { IOrderBody } from "../types/orderInterfaces.js";

//Dal fronted ricevero un carrello con dentro questo:
// {
//   "user_id": 2, 
//   "total_price": "1599.98",
//   "status": "PENDING",
//   "items": [
//     { "product_id": 1, "price": "999.99", "quantity": 1 },
//     { "product_id": 2, "price": "599.99", "quantity": 1 }
//   ]
// }
// questi dati andranno a riempide due tabelle ORDERS e ORDER_ITEM tramite una transaction di drizzle
// una transaction e una sequenza di operazioni nel db che sono eseguite come una sola unita
// garantisce:
// atomicita, tutte le operazioni hanno successo o tutte falliscono( non puo andare a buon fine una sola operazione parziale)
// consistenza, il db va da uno stato valido ad un altro


//orderRoutes sostituisce il controller in fastify
export default async function orderRoutes( server : FastifyInstance) {
  
// Schema per la validazione del body ( corrisponde ad IOrderBody)
  const postOrderOpts = {
      schema: {
          body: {
              type: 'object',
              required: ['total_price', 'items'],
              properties: {
                  total_price: { type: 'string' },
                  status: { type: 'string', enum: ['PENDING', 'COMPLETED'] },
                  items: {
                      type: 'array',
                      items: {
                          type: 'object',
                          required: ['product_id', 'price', 'quantity'],
                          properties: {
                              product_id: { type: 'number' },
                              price: { type: 'string' },
                              quantity: { type: 'number' }
                          }
                      }
                  }
              }
          }
      }
    };

  // Generics: define the shape of request/response objects for type-safety and autocompletion.
  // <{ Body: IOrderBody }> tells TypeScript that request.body has the shape of IOrderBody interface.
  // Generics: definiscono la forma degli oggetti request/response per type-safety e autocompletamento.
  // <{ Body: IOrderBody }> dice a TypeScript che request.body ha la forma dell'interfaccia IOrderBody.
  server.post<{ Body: IOrderBody }>("/", postOrderOpts, async (request, reply) => {

  // user_id comes from authMiddleware hook which decodes the JWT token and attaches it to request.user
  // user_id viene dall'hook authMiddleware che decodifica il token JWT e lo attacca a request.user
  const user_id = request.user!.userId;
  
  // request.body is validated against postOrderOpts schema before reaching this handler
  // request.body viene validato rispetto allo schema postOrderOpts prima di arrivare alla funzione che gestesce la richiesta
  const { total_price, status, items }  = request.body;
    try {
      const result = await orderService.createOrder( user_id, total_price, status, items);

      // Structured JSON logging for audit/observability (Grafana/Loki etc.)
      // Pino (Fastify's logger) outputs JSON by default, making it easy to query logs.
      // Example query in Loki: {app="orders-service"} | json | event="ORDER_CREATED"
      request.log.info({
        event: 'ORDER_CREATED',
        status: status,
        userId: user_id,
        orderId: result.orderId,
        itemCount: result.itemCount
      }, "Order created");

      reply.code(201).send({ 
        message:"orders created successfully!",
        orderId: result.orderId,
        itemCount: result.itemCount
      });
    } catch (error) {
      console.error("Error creating order", error);
      reply.code(500).send({
        error: "Failed to create order!"
      });
    }
  });
};