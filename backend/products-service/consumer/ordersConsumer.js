import { getRedisClient } from '../redis/redisClient.js';
import { getPool } from '../db/getPool.js';

export async function startConsumer() {
  
  const pool = getPool();
  const redis = await getRedisClient();

  const processMessage = async (message) => {

    const orderData = {};

    for (let i = 0; i < message[1].length; i+= 2) {
        const key = message[1][i];
        const value = message[1][i + 1];
        orderData[key] = value;
    }

    // getting the order_id from orderData to use later in redis XADD
    const orderID = orderData.order_id;

    console.log("order_id: ", orderData.order_id);
    console.log("type of order_id: ", typeof(orderData.order_id));
  
    // need to parse the JSON string
    const orderProducts = JSON.parse(orderData.products);
    // console.log(orderProducts)
    // before parse is a JSON
    // products-service  | [{"product_id":1,"price":"999.99","quantity":1},{"product_id":2,"price":"149.99","quantity":1}]
    // after parse is JS array containing js object
    // products-service  | [
    // products-service  |   { product_id: 1, price: '999.99', quantity: 1 },
    // products-service  |   { product_id: 2, price: '149.99', quantity: 1 }
    // products-service  | ]

    // PG TRANSACTION https://node-postgres.com/features/transactions
    const client = await pool.connect(); // get a dedicated pool connection for transactions(same connection for BEGIN COMMIT ROLLBACK)
    let orderFailed = false;

    await client.query('BEGIN')
    try {
      for (let item of orderProducts) {
  
        const productOrderdID = item.product_id;
        const productOrderedPrice = item.price;
        const productOrderedQuantity = item.quantity;
        // UPDATE query on DB_PRODUCT
        const text = `UPDATE "products" 
                      SET "quantity" = "quantity" - $1 
                      WHERE "id" = $2 AND "quantity" >= $1
                      RETURNING *`;
        // This is a simple SQL query that uses placeholders ($1, $2) to prevent SQL injection.
        const values = [productOrderedQuantity, productOrderdID];
        // 'values' is an array containing the data to be inserted into the database.
        const result = await client.query( text, values); 
        
        // console.log('result.rowCount', result.rowCount);
        // console.log(`Product ${productOrderdID} quantity updated!`);

        if (result.rowCount === 0) {
          console.error(`Failed to update product ${productOrderdID} - insufficient quantity or not found`);
          orderFailed = true;
          break;
        }

        if (result.rowCount === 1) {
            console.log(`Product ${productOrderdID} quantity updated!`);
        }
      }
      
      if (!orderFailed) {
        await client.query('COMMIT')
        console.log("Order updated successfully!");

        // publish event on inventory_stream (status "COMPLETED") then read this stream and update DB_ORDERS with the same status
        await redis.xadd(
          "inventory_stream",
          "*", // auto-generate ID
          'order_id', orderID,
          'status', "COMPLETED"
        );
      } else {
        await client.query('ROLLBACK')
        console.error("Failed to update order!");
        //publish event on inventory_stream( status "FAILED") then read this stream and update DB_ORDERS with the same status
        await redis.xadd(
          "inventory_stream",
          "*", // auto-generate ID
          'order_id', orderID,
          'status', "FAILED"
        );
      }
      
    } catch (error) {
        await client.query('ROLLBACK')
        console.error(`Transaction failed: `, error);
        // publish failed on inventory stream
        await redis.xadd(
          "inventory_stream",
          "*", // auto-generate ID
          'order_id', orderID,
          'status', "FAILED"
        );
    } finally {
      client.release(); // must call this for avoiding connections pool leaks
    }
  };

async function listenForMessage() {
    let lastId = "$";
    let isRedisDown = false;
    // `results` is an array, each element of which corresponds to a key.
    // Because we only listen to one key (mystream) here, `results` only contains
    // a single element. See more: https://redis.io/commands/xread#return-value
    while (true) {
      try {
        const results = await redis.xread("BLOCK", 0, "STREAMS", "orders_stream", lastId);

         if (isRedisDown) {
          console.log("Consumer: Redis reconnected, resuming...");
          isRedisDown = false;
        }

        const [key, messages] = results[0]; // `key` equals to "mystream"

        for (const msg of messages) {
        // forEach doesn't wait for async function
        // messages.forEach(processMessage);
          await processMessage(msg);
        }

        // Pass the last id of the results to the next round.
        lastId = messages[messages.length - 1][0];  // Update for next iteration
      } catch (error) {
        if (!isRedisDown) {
          // Log only once when Redis goes down
          console.error("Consumer: Redis connection lost, retrying every 5s...");
          isRedisDown = true;
        }
          await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s before retry
      }
    }
  }
    listenForMessage();
  }