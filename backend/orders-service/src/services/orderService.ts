import {db} from "../db/index.js"
import { orders, orderItems } from "../db/schema.js";
import { getRedisClient } from "../redis/redisClient.js"
import type { IOrderItem } from "../types/orderInterfaces.js";

/**
 * Creates a new order with its items in a single transaction and publishes to Redis.
 * 
 * @param userId - The ID of the user placing the order
 * @param totalPrice - The total price of the order as a string
 * @param status - The order status: "PENDING", "COMPLETED", or undefined (defaults to PENDING)
 * @param items - Array of order items containing product_id, price, and quantity
 * @returns Promise containing the created orderId and the number of items
 * @throws Error if the database transaction or Redis publish fails
 */
export async function createOrder(
    userId: number,
    totalPrice: string,
    status: "PENDING" | "COMPLETED" | undefined,
    items: IOrderItem[]
): Promise<{ orderId: number; itemCount:number }> {

    const orderId = await db.transaction( async (tx) => {
      const [ orderIDReturned ]= await tx
        .insert(orders)
        .values({
          userId: userId,
          status: status,
          totalPrice: totalPrice 
      })
      .returning({ insertedId: orders.id });
        
      await tx.insert(orderItems).values(
        items.map(item=> ({
          orderId: orderIDReturned!.insertedId,
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      );
      
      return orderIDReturned!.insertedId;
    });
    
    // invio messaggio a redis stream (publisher)
    const redis = await getRedisClient();

    await redis.xadd(
      "orders_stream",
      "*", // auto-generate ID
      'order_id', orderId.toString(),
      'products', JSON.stringify(items)
    );

    return { orderId, itemCount: items.length}
};



// fastify generics
// https://fastify.dev/docs/latest/Reference/TypeScript/#using-generics

// drizzle transaction
// https://orm.drizzle.team/docs/transactions

// drizzle insert + returning
// https://orm.drizzle.team/docs/insert

// publisher tested:
// after a post on /oders I can see this on redis-cli
// 127.0.0.1:6379> XREAD STREAMS orders_stream 0
// 1) 1) "orders_stream"
//    2) 1) 1) "1767783162611-0"
//          2) 1) "order_id"
//             2) "2"
//             3) "products"
//             4) "[{\"product_id\":1,\"price\":\"999.99\",\"quantity\":1},{\"product_id\":3,\"price\":\"9.99\",\"quantity\":1},{\"product_id\":5,\"price\":\"99.99\",\"quantity\":10}]"


// post /orders -> orders created-> save to db_orders ( status is PENDING) -> order-sercice publish on redis stream in orders_stream( when transaction on db_orders is ok!)
// (product-service consumers) read from redis stream (orders_stream)-> update product quantity ( decrease) in DB_PRODUCTS -> publish on inventory_stream ( inventory updated)
// (orders-service consumers) read from redis stream (inventory_stream) -> update status to "COMPLETED" in DB_ORDERS

// orders-service (producer) → orders_stream
// products-service (consumer) ← orders_stream
// products-service (producer) → inventory_stream  
// orders-service (consumer) ← inventory_stream
// PRO:
// Each service is both producer AND consumer - Standard pattern
// Loose coupling - Services communicate only via events
// Independent scaling - Each consumer can scale separately
// Event-driven choreography - No central orchestrator needed
// Matches production systems - This is industry-standard event-driven microservices architecture.