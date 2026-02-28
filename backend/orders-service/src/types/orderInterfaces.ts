// Interfaces: used for compile-time type checking to validate object shapes during development
// Interfacce: usate per validare la forma degli oggetti durante lo sviluppo (type checking a compile-time)

// Represents a single item in an order (maps to order_items table)
// Rappresenta un singolo item di un ordine (mappa la tabella order_items, come un django model)
export interface IOrderItem {
  product_id: number;
  price: string; // DECIMAL in postgres/drizzle becomes string to preserve arithmetic precision
  quantity: number;
}

// Represents the request body for creating an order (used for type checking during development)
// Rappresenta il body della richiesta per creare un ordine (usato per type checking durante lo sviluppo)
export interface IOrderBody{
  // user_id: number;
  total_price: string; // DECIMAL --> string
  status?: "PENDING" | "COMPLETED";
  items: IOrderItem[];
}

// Module Augmentation: extends Fastify's built-in FastifyRequest interface to add custom properties.
// This allows TypeScript to recognize 'request.user' throughout the codebase without manual casting.
// Without this, accessing request.user would cause a TypeScript error: "Property 'user' does not exist".

// Module Augmentation: estende l'interfaccia FastifyRequest di Fastify per aggiungere proprietà custom.
// Permette a TypeScript di riconoscere 'request.user' in tutto il codice senza bisogno di casting manuale.
// Senza questo, accedere a request.user causerebbe un errore TypeScript: "Property 'user' does not exist".
declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: number; username: string; email: string };
  }

}