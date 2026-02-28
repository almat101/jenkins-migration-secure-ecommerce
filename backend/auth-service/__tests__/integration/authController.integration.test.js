import { PostgreSqlContainer } from "@testcontainers/postgresql";
import request from "supertest";
import bcrypt from "bcrypt";
import pg from "pg";
import {
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  test,
  expect,
} from "@jest/globals";

let container;
let app;
let pool;

// Timeout per avvio container Docker
jest.setTimeout(60000);

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();

  process.env.POSTGRES_HOST_AUTH = container.getHost();
  process.env.POSTGRES_PORT_AUTH = container.getPort().toString();
  process.env.POSTGRES_USER_AUTH = container.getUsername();
  process.env.POSTGRES_PASSWORD_AUTH = container.getPassword();
  process.env.POSTGRES_DB_AUTH = container.getDatabase();
  process.env.JWT_SECRET = "test-secret-key-for-integration-tests";

  pool = new pg.Pool({
    host: container.getHost(),
    port: container.getPort().toString(),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Import dinamico DOPO aver settato le env variables
  const appModule = await import("../../app.js");
  app = appModule.default;
});

afterAll(async () => {
  // Chiudi il pool dell'app (creato da getPool)
  const dbModule = await import("../../config/database.js");
  const appPool = dbModule.getPool();
  if (appPool) await appPool.end();

  // Chiudi il pool del test
  if (pool) await pool.end();

  // Ferma il container
  if (container) await container.stop();
});

beforeEach(async () => {
  // Pulizia tabella ad ogni test
  await pool.query("DELETE FROM users");
});

// Helper per creare utente di test
async function createTestUser(username, email, password) {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
    [username, email, hash]
  );
  return result.rows[0];
}

describe("Integration test for /login", () => {
  test("Should return 200, set JWT cookie on valid login", async () => {
    // Crea utente di test
    await createTestUser("alex", "alex@gmail.com", "testciao12");

    const loginBody = {
      email: "alex@gmail.com",
      password: "testciao12",
    };

    const response = await request(app).post("/auth/login").send(loginBody);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ message: "Login successful" });

    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("token=");
    expect(cookies[0]).toContain("HttpOnly");
  });

  test("Should return 401 on wrong password", async () => {
    await createTestUser("alex", "alex@gmail.com", "testciao12");

    const loginBody = {
      email: "alex@gmail.com",
      password: "wrongpassword123",
    };

    const response = await request(app).post("/auth/login").send(loginBody);

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      message: "Unauthorized",
    });
  });

  test("Should return 401 on non-existent email and return Unauthorized", async () => {
    const loginBody = {
      email: "nonexistent@gmail.com",
      password: "testciao12",
    };

    const response = await request(app).post("/auth/login").send(loginBody);

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      message: "Unauthorized",
    });
  });

  test("Should return 400 on invalid email(joy validation error) and return Unauthorized", async () => {
    const loginBody = {
      email: "invalid.email",
      password: "testciao12",
    };

    const response = await request(app).post("/auth/login").send(loginBody);

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      message: "Bad Request",
    });
  });
});

describe("Integration test for /demo", () => {
  test("Should return 200 and set cookie for demo user", async () => {
    await createTestUser("demo", "demo@demo.com", "demotest");

    const response = await request(app).get("/auth/demo");

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ message: "Login successful" });

    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("token=");
  });
});

//docs https://node.testcontainers.org/modules/postgresql/
