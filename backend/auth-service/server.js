import app from "./app.js";
import { getPool } from "./config/database.js";

const PORT = 3030;

const server = app.listen(PORT, () => {
  console.log(`Auth app listening on port ${PORT}`);
  console.log(`
          Route available:
          '/auth/signup (POST)
          '/auth/login' (POST)
          `);
});

// server.close wrapped into a promise to handle async/await
const serverCloseAsPromise = () =>
  new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

async function shutdown(signal) {
  console.log(`Received  ${signal}.Closing database and server...`);
  const pool = getPool();
  //close the server (ensure it does not accept new connections)
  await serverCloseAsPromise();
  //close the db connection pool
  await pool.end();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
