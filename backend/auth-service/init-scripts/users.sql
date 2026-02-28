-- nuova logica marketplace -- 
-- utente demo fa da venditore, mette in vendita i suoi prodotti
-- utente demo2 fa da compratore, puo comprare i prodotti di utente demo o di altri utenti registrati
-- naturalmente sia demo che demo2 possono sia vendere che comprare

-- Inizializzazione tabella users 
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL, -- inserimento ruolo USER o ADMIN  ( da rivedere)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserimento utente demo (il venditore)
INSERT INTO users (username, email, password_hash)
VALUES ('demo', 'demo@demo.com', '$2b$10$Sg4fgd3LWumHL1hMNvfpweod6v2ZtBYMD2vEyPp7Z2lW/l21lJ7Qu')
ON CONFLICT (email) DO NOTHING;
-- demo demo@demo.com demotest


-- Inserimento utente demo2 (il compratore)
INSERT INTO users (username, email, password_hash)
VALUES ('demo2', 'demo2@demo.com', '$2b$10$Sg4fgd3LWumHL1hMNvfpweod6v2ZtBYMD2vEyPp7Z2lW/l21lJ7Qu')
ON CONFLICT (email) DO NOTHING;
-- demo2 demo2@demo.com demotest

-- -- Insert Utente ADMIN (gestore)
-- INSERT INTO users (username, email, password_hash, role)
-- VALUES ('admin', 'admin@admin.com', '$2b$10$Sg4fgd3LWumHL1hMNvfpweod6v2ZtBYMD2vEyPp7Z2lW/l21lJ7Qu', 'ADMIN')
-- ON CONFLICT (email) DO UPDATE SET role = 'ADMIN';
-- -- admin admin@admin.com demotest
