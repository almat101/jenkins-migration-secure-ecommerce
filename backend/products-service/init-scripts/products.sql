-- Inizializzazione tabella products -- -- nuova logica marketplace --
CREATE TABLE products (  
    id SERIAL PRIMARY KEY,  
    name VARCHAR(255) NOT NULL,  
    price NUMERIC(10, 2) NOT NULL,  
    category VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    user_id INTEGER NOT NULL, -- user_id e l id del venditore qui in db_orders c'e invece il compratore
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- aggiunta della creazione del prodotto da vendere
);


-- Insert sample data into the products table
INSERT INTO products (name, price, category, quantity, user_id) VALUES 
('Mac m2', 999.99, 'Electronics', 5, 1),
('Desk Chair', 149.99, 'Furniture', 2, 1),
('Backpack', 39.99, 'Accessories', 3, 1),
('Pixel 10', 899.99, 'Electronics', 5, 1),
('Pixel 9', 599.99, 'Electronics', 10, 2),
('Coffee Table', 89.99, 'Furniture', 5, 2),
('Headphones', 49.99, 'Accessories', 6, 2),
('Iphone 16', 899.99, 'Electronics', 10, 2);



-- Se avessi usato un solo DATABASE per contenere entrambe le tabelle prodotti e utenti avrei potuto usare
-- una foreign key per collegare la tabella products con un utente specifico tramite il suo id
-- Nelle app a microservizi basta usare un ID per mantenere la logica tra la tabella products e il suo ID utente apposito
