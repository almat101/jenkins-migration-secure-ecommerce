import {
  integer,
  pgTable,
  varchar,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  // we can use also id as serial but is an old method
  // id: serial("id").primaryKey(),
  //Relazione ESTERNA (microservizio auth): e un intero, non e una fk
  userId: integer("user_id").notNull(),

  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),

  status: varchar("status", { length: 50 }).default("PENDING"), //UPDATE TO PENDING
  //ORDER STATUS:
  // 1 order created -> status "PENDING" -> sent to redis stream
  // 2 order processed -> status "COMPLETED" -> saved to Postgres
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. TABELLA ORDER ITEMS
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  // Relazione INTERNA (Stesso DB): qui serve la FK vera
  // .references(() => orders.id) crea il vincolo FOREIGN KEY nel database
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  // Relazione ESTERNA (Microservizio Product): È solo un numero
  productId: integer("product_id").notNull(),

  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// 3. RELAZIONI APPLICATIVE
// Questo serve a Drizzle per fare le query tipo: "Dammi l'ordine CON i suoi oggetti"
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems), // Un ordine ha tanti items
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    // Un item appartiene a un ordine
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

//CODICE SQL PURE
// -- DATABASE DEL SERVIZIO ORDERS

// -- Tabella 1: L'ordine (Testata)
// CREATE TABLE orders (
//     id SERIAL PRIMARY KEY,         -- SÌ: Primary Key
//     user_id INTEGER NOT NULL,      -- NO FK: L'utente sta nel DB Auth! È solo un numero qui.
//     total_price NUMERIC(10, 2),
//     status VARCHAR(50) DEFAULT "PENDING",
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// -- Tabella 2: Le righe (Dettaglio)
// CREATE TABLE order_items (
//     id SERIAL PRIMARY KEY,         -- SÌ: Primary Key

//     -- RELAZIONE INTERNA (Stesso DB) -> SÌ FOREIGN KEY
//     order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,

//     -- RELAZIONE ESTERNA (Altro DB) -> NO FOREIGN KEY (Solo Integer)
//     product_id INTEGER NOT NULL,

//     quantity INTEGER NOT NULL,

//     price NUMERIC(10, 2) NOT NULL
// );
