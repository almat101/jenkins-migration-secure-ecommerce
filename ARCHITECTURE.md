# Mini CRUD App - E-Commerce Microservices Platform

A full-stack **e-commerce/marketplace application** with **event-driven microservices architecture**, built to demonstrate modern backend patterns, asynchronous communication with **Redis Streams**, and secure deployment practices.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Backend Services](#backend-services)
   - [Auth-Service](#1️⃣-auth-service)
   - [Products-Service](#2️⃣-products-service)
   - [Orders-Service](#3️⃣-orders-service)
4. [Redis Streams - Event-Driven Communication](#redis-streams---event-driven-communication)
5. [Frontend](#frontend)
6. [Infrastructure](#infrastructure)
7. [Design Patterns](#design-patterns)
8. [Security](#security)
9. [Testing](#testing)
10. [How to Run](#how-to-run)
11. [Next Implementations](#next-implementations)

---

## 🏗️ Architecture Overview

This project implements a **microservices architecture** where services communicate through **Redis Streams** for asynchronous, reliable message passing.

```
┌──────────────┐
│   Frontend   │ (React + Bootstrap)
│  (Port 8080) │
└──────┬───────┘
       │
       │ HTTP/REST
       │
┌──────▼────────────────────────────────────────────────────┐
│                  Docker Network (crud-app)                │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Auth-Service │  │Products-     │  │Orders-       │    │
│  │(Express)    │  │Service       │  │Service       │    │
│  │Port 3030    │  │(Express)     │  │(Fastify+TS)  │    │
│  └──────┬──────┘  │Port 3020     │  │Port 3040     │    │
│         │         └───┬──────┬───┘  └───┬──────┬───┘    │
│         │             │      │          │      │         │
│    ┌────▼────┐   ┌────▼──┐  │     ┌────▼──┐   │         │
│    │db_auth  │   │db_    │  │     │db_    │   │         │
│    │(PG)     │   │products│  │     │orders │   │         │
│    └─────────┘   │(PG)   │  │     │(PG)   │   │         │
│                  └───────┘  │     └───────┘   │         │
│                             │                 │         │
│                   ┌─────────▼─────────────────▼──────┐  │
│                   │         Redis Streams            │  │
│                   │  • orders_stream                 │  │
│                   │  • inventory_stream              │  │
│                   └──────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology |
|-----------|-----------|
| **Frontend** | React, React Router, Bootstrap 5, Axios |
| **Auth-Service** | Express.js, PostgreSQL, JWT, bcrypt, Joi |
| **Products-Service** | Express.js, PostgreSQL, Redis (Consumer) |
| **Orders-Service** | Fastify, TypeScript, PostgreSQL, Drizzle ORM, Redis (Publisher) |
| **Message Broker** | Redis Streams (ioredis) |
| **Databases** | PostgreSQL 17 (3 separate databases) |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions, Ansible |
| **Tunnel** | Cloudflare Tunnel |

---

## 📁 Project Structure

```
mini_crud_app/
├── backend/
│   ├── auth-service/              # Authentication & User Management
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── services/              # Business logic layer
│   │   ├── repositories/          # Database access layer
│   │   ├── routes/                # Route definitions
│   │   ├── config/                # Database & JWT config
│   │   ├── __tests__/             # Unit & Integration tests
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── init-scripts/          # Database initialization
│   │   ├── server.js
│   │   ├── app.js
│   │   └── Dockerfile
│   │
│   ├── products-service/          # Product Catalog & Inventory
│   │   ├── consumer/              # Redis Stream consumer
│   │   │   └── ordersConsumer.js  # Processes orders from orders_stream
│   │   ├── redis/                 # Redis client configuration
│   │   ├── db/                    # PostgreSQL connection pool
│   │   ├── init-scripts/          # Database initialization
│   │   ├── products.js            # Main service file
│   │   └── Dockerfile
│   │
│   └── orders-service/            # Order Processing (TypeScript)
│       ├── src/
│       │   ├── routes/            # Fastify route handlers
│       │   ├── services/          # Business logic + Redis publisher
│       │   ├── db/                # Drizzle ORM schema & client
│       │   ├── redis/             # Redis client configuration
│       │   ├── middleware/        # JWT authentication hook
│       │   ├── types/             # TypeScript interfaces
│       │   ├── app.ts             # Fastify app configuration
│       │   └── server.ts          # Server startup
│       ├── drizzle/               # Drizzle ORM migrations
│       ├── init-scripts/          # Database initialization
│       ├── tsconfig.json
│       └── Dockerfile
│
├── frontend/                      # React SPA
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── BSNavbar.js
│   │   │   ├── CartPage.js
│   │   │   ├── MyHome.js
│   │   │   ├── ProductPage.js
│   │   │   ├── LoginForm.js
│   │   │   └── SignupForm.js
│   │   ├── context/               # React Context API
│   │   │   ├── AuthContext.js     # Authentication state
│   │   │   └── CartContext.js     # Shopping cart state
│   │   ├── interceptor/           # Axios interceptors
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── conf/                      # Nginx configuration
│   ├── Dockerfile
│   └── package.json
│
├── ansible/                       # Deployment automation
├── .github/workflows/             # CI/CD pipelines
│   └── deploy.yml
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

---

## 🔧 Backend Services

### 1️⃣ **Auth-Service** 

**Port**: `3030` (internal)  
**Database**: `db_auth` (PostgreSQL)  
**Framework**: Express.js  
**Architecture**: Controller-Service-Repository Pattern

#### Responsibilities
- User registration and authentication
- JWT token generation and validation
- Password hashing with bcrypt
- Input validation with Joi

#### Database Schema (`users` table)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/demo-login` | Demo login (for testing) |

#### Code Structure

**Controllers** ([`authController.js`](backend/auth-service/controllers/authController.js))
- Handle HTTP requests/responses
- Delegate business logic to services
- Return appropriate HTTP status codes

**Services** ([`authService.js`](backend/auth-service/services/authService.js))
- Business logic (validation, hashing, token generation)
- Independent of HTTP layer (reusable)

**Repositories** ([`authRepository.js`](backend/auth-service/repositories/authRepository.js))
- Database queries (CRUD operations)
- Connection pool management

#### Tests
- ✅ **Unit Tests**: Test individual functions (services/repositories)
- ✅ **Integration Tests**: Test full HTTP request flow
- Pattern: **AAA** (Arrange-Act-Assert)

---

### 2️⃣ **Products-Service**

**Port**: `3020` (internal)  
**Database**: `db_products` (PostgreSQL)  
**Framework**: Express.js  
**Redis**: Consumer of `orders_stream`

#### Responsibilities
- CRUD operations for products
- Inventory management (stock quantities)
- **Redis Stream Consumer**: Listens to `orders_stream` and updates inventory

#### Database Schema (`products` table)

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    user_id INTEGER NOT NULL,        -- Seller ID (external reference)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products/public/` | Public catalog (all products) | ❌ |
| GET | `/api/products/` | User's products (seller view) | ✅ |
| GET | `/api/products/my-home/` | Products from other sellers | ✅ |
| GET | `/api/products/:id` | Get single product | ✅ |
| POST | `/api/products` | Create new product | ✅ |
| PATCH | `/api/products/:id` | Update product | ✅ |
| DELETE | `/api/products/:id` | Delete product | ✅ |

#### Redis Stream Consumer

**File**: [`consumer/ordersConsumer.js`](backend/products-service/consumer/ordersConsumer.js)

**What it does:**
1. Listens to `orders_stream` (blocking read with `XREAD`)
2. For each order, decrements product quantities in a **PostgreSQL transaction**
3. Publishes result to `inventory_stream`:
   - `COMPLETED` if all products had sufficient stock
   - `FAILED` if any product was out of stock

**Code Flow:**
```javascript
// Infinite loop listening to orders_stream
while (true) {
  const results = await redis.xread("BLOCK", 0, "STREAMS", "orders_stream", lastId);
  
  for (const msg of messages) {
    await processMessage(msg);  // Update inventory
  }
  
  lastId = messages[messages.length - 1][0];  // Update cursor
}
```

**Transaction Example:**
```javascript
await client.query('BEGIN');
try {
  for (let item of orderProducts) {
    const result = await client.query(
      `UPDATE products 
       SET quantity = quantity - $1 
       WHERE id = $2 AND quantity >= $1
       RETURNING *`,
      [quantity, productId]
    );
    
    if (result.rowCount === 0) {
      orderFailed = true;
      break;
    }
  }
  
  if (!orderFailed) {
    await client.query('COMMIT');
    await redis.xadd("inventory_stream", "*", 
      'order_id', orderID,
      'status', "COMPLETED"
    );
  } else {
    await client.query('ROLLBACK');
    await redis.xadd("inventory_stream", "*",
      'order_id', orderID,
      'status', "FAILED"
    );
  }
} catch (error) {
  await client.query('ROLLBACK');
}
```

---

### 3️⃣ **Orders-Service**

**Port**: `3040` (internal)  
**Database**: `db_orders` (PostgreSQL)  
**Framework**: Fastify + TypeScript  
**ORM**: Drizzle ORM  
**Redis**: Publisher to `orders_stream`

#### Responsibilities
- Create customer orders
- Store order details in database
- **Redis Stream Publisher**: Publishes new orders to `orders_stream`

#### Database Schema (Drizzle ORM)

**File**: [`src/db/schema.ts`](backend/orders-service/src/db/schema.ts)

```typescript
// orders table
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),  // External reference (auth-service)
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});

// order_items table
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull()
    .references(() => orders.id, { onDelete: "cascade" }),  // Internal FK
  productId: integer("product_id").notNull(),  // External reference (products-service)
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});
```

#### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create new order | ✅ |
| GET | `/health` | Health check | ❌ |

#### Redis Stream Publisher

**File**: [`src/services/orderService.ts`](backend/orders-service/src/services/orderService.ts)

**What it does:**
1. Receives order data from frontend
2. Saves order to database in a **Drizzle transaction** with status `PENDING`
3. Publishes order details to `orders_stream` for inventory processing

**Code Flow:**
```typescript
export async function createOrder(
  userId: number,
  totalPrice: string,
  status: "PENDING" | "COMPLETED" | undefined,
  items: IOrderItem[]
): Promise<{ orderId: number; itemCount: number }> {
  
  // 1. Save to database
  const orderId = await db.transaction(async (tx) => {
    const [orderIDReturned] = await tx
      .insert(orders)
      .values({ userId, status, totalPrice })
      .returning({ insertedId: orders.id });
    
    await tx.insert(orderItems).values(
      items.map(item => ({
        orderId: orderIDReturned!.insertedId,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    );
    
    return orderIDReturned!.insertedId;
  });
  
  // 2. Publish to Redis Stream
  const redis = await getRedisClient();
  await redis.xadd(
    "orders_stream",
    "*",  // auto-generate message ID
    'order_id', orderId.toString(),
    'products', JSON.stringify(items)
  );
  
  return { orderId, itemCount: items.length };
}
```

---

## 🔥 Redis Streams - Event-Driven Communication

### What is Redis Streams?

**Redis Streams** is a data structure in Redis that acts as a **distributed message log** (similar to Kafka, but simpler). It's ideal for:
- Asynchronous communication between microservices
- Event-driven architecture
- Persistent message queues

### Architecture in This Project

```
┌──────────────────┐          ┌─────────────┐          ┌──────────────────┐
│  Orders-Service  │--------->│   Redis     │--------->│ Products-Service │
│   (Producer)     │  XADD    │  Streams    │  XREAD   │   (Consumer)     │
└──────────────────┘          └─────────────┘          └──────────────────┘
                                    │
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
                 v                                     v
      ┌──────────────────┐                 ┌──────────────────┐
      │  orders_stream   │                 │ inventory_stream │
      └──────────────────┘                 └──────────────────┘
         Published by:                        Published by:
         orders-service                       products-service
         
         Consumed by:                         Consumed by:
         products-service                     orders-service (TODO)
```

### Complete Order Flow

#### Step 1: User Checkout (Frontend)

```javascript
// CartPage.js
const orderData = {
  total_price: "1599.98",
  status: "PENDING",
  items: [
    { product_id: 1, price: "999.99", quantity: 1 },
    { product_id: 2, price: "599.99", quantity: 1 }
  ]
};

await axios.post('/api/orders', orderData, { withCredentials: true });
```

#### Step 2: Orders-Service Processes Request

1. **Validates** the request (Fastify schema validation)
2. **Extracts** user_id from JWT (authMiddleware)
3. **Saves** order to `db_orders` with status `PENDING`
4. **Publishes** to `orders_stream`:

```typescript
await redis.xadd(
  "orders_stream",
  "*",
  'order_id', '42',
  'products', '[{"product_id":1,"price":"999.99","quantity":1}]'
);
```

#### Step 3: Products-Service Consumes Message

The consumer (always running) receives the message:

```javascript
// Reads from orders_stream
const results = await redis.xread("BLOCK", 0, "STREAMS", "orders_stream", lastId);
// Format: [['orders_stream', [['1767783162611-0', ['order_id', '42', 'products', '[...]']]]]]

// Parses message
const orderData = {
  order_id: '42',
  products: [{ product_id: 1, price: "999.99", quantity: 1 }]
};
```

#### Step 4: Inventory Update (Transaction)

```javascript
await client.query('BEGIN');

for (let item of orderProducts) {
  const result = await client.query(
    `UPDATE products 
     SET quantity = quantity - $1 
     WHERE id = $2 AND quantity >= $1
     RETURNING *`,
    [item.quantity, item.product_id]
  );
  
  if (result.rowCount === 0) {
    // Product not found or insufficient stock
    orderFailed = true;
    break;
  }
}

if (!orderFailed) {
  await client.query('COMMIT');
  console.log("✅ Inventory updated successfully");
} else {
  await client.query('ROLLBACK');
  console.log("❌ Inventory update failed");
}
```

#### Step 5: Publish Result to inventory_stream

```javascript
if (!orderFailed) {
  await redis.xadd("inventory_stream", "*",
    'order_id', '42',
    'status', 'COMPLETED'
  );
} else {
  await redis.xadd("inventory_stream", "*",
    'order_id', '42',
    'status', 'FAILED'
  );
}
```

#### Step 6: Orders-Service Updates Status (TODO)

A consumer in `orders-service` should read from `inventory_stream` and update the order status in `db_orders`.

### Benefits of Redis Streams

| Benefit | Description |
|---------|-------------|
| ✅ **Decoupling** | Services don't call each other directly (loose coupling) |
| ✅ **Reliability** | Messages are persisted; no data loss if a service crashes |
| ✅ **Scalability** | Multiple consumers can read from the same stream |
| ✅ **Event Sourcing** | Complete audit trail of all events |
| ✅ **Automatic Retry** | Consumers can resume from last processed message |
| ✅ **Asynchronous** | Non-blocking operations between services |

### Redis Commands (For Debugging)

```bash
# Enter Redis container
docker exec -it redis redis-cli

# View all messages in orders_stream from the beginning
XREAD STREAMS orders_stream 0

# View all messages with range
XRANGE orders_stream - +

# View last 5 messages
XREVRANGE orders_stream + - COUNT 5

# View stream info (length, first/last message, etc.)
XINFO STREAM orders_stream
```

---

## 🎨 Frontend

**Framework**: React 18  
**UI Library**: Bootstrap 5  
**Routing**: React Router v6  
**State Management**: Context API

### Features

- **Authentication**: Login/Signup forms with JWT
- **Product Catalog**: Browse products from all sellers
- **My Products**: Manage your own products (seller view)
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Place orders (sends to orders-service)
- **Demo Mode**: Test without registration

### Context Providers

#### AuthContext
- Manages user authentication state
- Stores JWT token in HTTP-only cookies
- Provides `isAuth`, `login`, `logout` functions

#### CartContext
- Manages shopping cart state (localStorage persistence)
- Provides `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getTotal`

### Key Components

| Component | Description |
|-----------|-------------|
| `MyHome.js` | Homepage with product catalog |
| `ProductPage.js` | Manage user's own products |
| `CartPage.js` | Shopping cart + checkout |
| `LoginForm.js` | Login interface |
| `SignupForm.js` | Registration interface |
| `BSNavbar.js` | Navigation bar with cart icon |

---

## 🐳 Infrastructure

### Docker Compose Services

| Service | Image | Port (Host) | Port (Internal) | Purpose |
|---------|-------|-------------|-----------------|---------|
| `frontend` | Custom (Nginx) | 8080 | 80 | React SPA |
| `auth-service` | Custom (Node) | - | 3030 | Authentication |
| `products-service` | Custom (Node) | - | 3020 | Product catalog |
| `orders-service` | Custom (Node) | - | 3040 | Order processing |
| `db_auth` | postgres:17 | - | 5432 | Auth database |
| `db_products` | postgres:17 | - | 5432 | Products database |
| `db_orders` | postgres:17 | - | 5432 | Orders database |
| `redis` | redis:8.4.0 | - | 6379 | Message broker |
| `cloudflared` | cloudflare/cloudflared | - | - | Tunnel for HTTPS |

### Network Isolation

All backend services and databases are **isolated within the Docker network** (`crud-app`). Only the frontend (Nginx) is exposed on port 8080.

This follows **security best practices**:
- Services communicate via internal DNS names (e.g., `http://auth-service:3030`)
- No direct external access to databases or backend APIs
- Single entry point through Nginx (acts as reverse proxy + static file server)

### Health Checks

All services implement health checks for:
- **Ordered startup** (`depends_on` with `condition: service_healthy`)
- **Auto-restart** on failure
- **Monitoring** container status

Example:
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3030/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 5s
```

### Volumes (Data Persistence)

```yaml
volumes:
  postgres_auth_data:       # Persists user data
  postgres_products_data:   # Persists product catalog
  postgres_orders_data:     # Persists order history
  redis_data:               # Persists Redis streams
```

---

## 🎯 Design Patterns

### 1. Controller-Service-Repository (CSR)

**Used in**: `auth-service`

```
HTTP Request → Controller → Service → Repository → Database
                   ↓           ↓           ↓
             (HTTP logic) (Business) (SQL queries)
```

**Benefits**:
- Separation of concerns
- Testability (mock each layer independently)
- Reusability (services can be used by multiple controllers)

### 2. Event-Driven Architecture (Choreography)

**Used in**: Communication between `orders-service` and `products-service`

```
orders-service → orders_stream → products-service
                                      ↓
                               inventory_stream
```

**Benefits**:
- Loose coupling (services don't know about each other)
- Scalability (add more consumers easily)
- Fault tolerance (messages persist even if consumers are down)

### 3. Singleton Pattern

**Used in**: Database connections, Redis clients

```javascript
let redisClient = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({ ... });
  }
  return redisClient;
}
```

**Benefits**:
- Single connection instance (efficient resource usage)
- Lazy initialization (connection created only when needed)

### 4. Transaction Pattern

**Used in**: All database writes affecting multiple tables

```javascript
await client.query('BEGIN');
try {
  await client.query('INSERT INTO orders ...');
  await client.query('INSERT INTO order_items ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
}
```

**Benefits**:
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Database stays in valid state
- **Isolation**: Concurrent transactions don't interfere

### 5. Middleware/Hook Pattern

**Used in**: JWT authentication

```javascript
// Express middleware
function JWT_middleware_decode(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;  // Attach user to request
  next();
}

app.get('/api/products', JWT_middleware_decode, (req, res) => {
  // req.user is available here
});
```

```typescript
// Fastify hook
server.addHook('preHandler', authMiddleware);
```

### 6. Plugin Pattern (Fastify)

**Used in**: `orders-service`

```typescript
// Each route is a plugin
export default async function orderRoutes(server: FastifyInstance) {
  server.post('/api/orders', async (request, reply) => { ... });
}

// Register plugin
server.register(orderRoutes, { prefix: '/api/orders' });
```

### 7. Context Pattern (React)

**Used in**: Frontend state management

```javascript
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
const { isAuth } = useContext(AuthContext);
```

---

## 🔐 Security

### ✅ Implemented

| Security Feature | Implementation |
|------------------|----------------|
| **JWT Authentication** | HTTP-only cookies (not localStorage) |
| **Password Hashing** | bcrypt with salt rounds |
| **SQL Injection Prevention** | Parameterized queries (`$1`, `$2`, etc.) |
| **CORS** | Configured for specific origins only |
| **Security Headers** | Helmet.js middleware |
| **Input Validation** | Joi for auth-service, Fastify schemas for orders-service |
| **Network Isolation** | Backend services not exposed to internet |
| **Environment Variables** | Sensitive data in `.env` (gitignored) |

### Example: SQL Injection Prevention

```javascript
// ❌ VULNERABLE (never do this!)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SAFE (parameterized query)
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

### Example: HTTP-only Cookies

```javascript
// Backend sets cookie
res.cookie('token', jwtToken, {
  httpOnly: true,    // Not accessible via JavaScript
  secure: true,      // HTTPS only
  sameSite: 'strict' // CSRF protection
});

// Frontend automatically sends cookie with requests
axios.post('/api/orders', data, { withCredentials: true });
```

---

## 🧪 Testing

### Auth-Service (Fully Tested)

#### Unit Tests
- **Target**: Individual functions (services, repositories)
- **Mock**: Database connections
- **Pattern**: AAA (Arrange-Act-Assert)
- **Runner**: Jest

Example:
```javascript
test("should hash a password", async () => {
  // Arrange
  const plaintextPassword = "test12345";

  // Act
  const hash = await hashPassword(plaintextPassword);

  // Assert
  expect(hash).toBeDefined();
  expect(hash).not.toBe(plaintextPassword);
  expect(await bcrypt.compare(plaintextPassword, hash)).toBe(true);
});
```

#### Integration Tests
- **Target**: Full HTTP request flow (controller → service → repository)
- **Mock**: Database with `jest.unstable_mockModule`
- **Tool**: Supertest

Example:
```javascript
jest.unstable_mockModule("../../repositories/authRepository.js", () => ({
  createUser: jest.fn(),
  findUser: jest.fn(),
}));

test("POST /api/auth/signup - success", async () => {
  findUser.mockResolvedValueOnce({ rowCount: 0 });  // User doesn't exist
  createUser.mockResolvedValueOnce({ rowCount: 1 });

  const response = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'test', email: 'test@test.com', password: 'test123' });

  expect(response.status).toBe(201);
  expect(response.body.message).toBe('User registered successfully');
});
```

### Products-Service & Orders-Service
- ⏳ Testing to be implemented

### Running Tests

```bash
cd backend/auth-service

# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

---

## 🚀 How to Run

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and **npm** (for local development)
- **Git** for cloning the repository

### Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mini_crud_app.git
cd mini_crud_app
```

#### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials (keep defaults for Docker)
- JWT secret (change in production!)
- Cloudflare tunnel token (optional, for external access)

#### 3. Start the Application

```bash
docker-compose up --build
```

This will:
1. Build all service images
2. Create databases with init scripts
3. Start Redis
4. Start backend services
5. Build and serve frontend

#### 4. Access the Application

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend Services**: Internal only (not exposed)
  - Auth-Service: `http://auth-service:3030` (from within Docker network)
  - Products-Service: `http://products-service:3020`
  - Orders-Service: `http://orders-service:3040`
  - Redis: `redis:6379`

#### 5. Demo Credentials

Two demo users are pre-created:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| demo | demo@demo.com | demotest | Seller |
| demo2 | demo2@demo.com | demotest | Buyer |

#### 6. Development Mode

For frontend development with hot reload:

```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

Set `REACT_APP_IS_DEV=true` in `.env` to use development API URLs.

#### 7. Stopping the Application

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop and remove volumes (deletes data!)
```

---

## 📝 Next Implementations

### Completed ✅
- ✅ JWT-based authentication
- ✅ HTTP-only cookies for token storage
- ✅ Redis Streams for event-driven architecture
- ✅ Database per service (microservices pattern)
- ✅ Docker containerization
- ✅ Health checks for all services
- ✅ Network isolation (security)

### In Progress 🔄
- 🔄 **Inventory Stream Consumer** (orders-service): Listen to `inventory_stream` and update order status
- 🔄 **Refactor products-service**: Implement Controller-Service-Repository pattern

### Planned 📋

1. **Role-Based Access Control (RBAC)**
   - Admin role for user management
   - Permissions system

2. **Rate Limiting**
   - Prevent API abuse
   - Per-user quotas

3. **Structured Logging**
   - Pino or Winston for JSON logs
   - Correlation IDs for tracing requests across services
   - Integration with Grafana Loki

4. **API Documentation**
   - Swagger/OpenAPI for REST endpoints
   - Auto-generated from code

5. **End-to-End (E2E) Tests**
   - Playwright or Cypress
   - Full user journey tests

6. **Monitoring & Observability**
   - Prometheus metrics export
   - Grafana dashboards
   - Alerting rules

7. **Message Acknowledgment**
   - Redis Stream consumer groups
   - Prevent duplicate processing

8. **Dead Letter Queue**
   - Handle failed messages
   - Retry logic with exponential backoff

9. **CQRS Pattern**
   - Separate read/write models
   - Optimize for query performance

10. **WebSockets**
    - Real-time order status updates
    - Live inventory changes

---

## 📚 Additional Documentation

- [`Framework.md`](Framework.md) - Comparison of backend frameworks (Express, Fastify, NestJS, Spring Boot)
- [`jest.md`](jest.md) - Testing guide with Jest
- [`backend/orders-service/README.md`](backend/orders-service/README.md) - Orders-service specific documentation
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) - CI/CD pipeline configuration

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---