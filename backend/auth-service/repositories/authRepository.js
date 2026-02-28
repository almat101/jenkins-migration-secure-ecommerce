import { getPool } from "../config/database.js";

export async function testDatabaseConnection() {
  const pool = getPool();
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// prev_query e' una query preventiva che serve a controllare se un utente o emai e' gia esistente
// const prev_query = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [ validateUser.username , validateUser.email ])
export async function executePrevQuery(username, email) {
  try {
    const pool = getPool();
    return pool.query("SELECT * FROM users WHERE username = $1 OR email = $2", [
      username,
      email,
    ]);
  } catch {
    throw new Error("Error on executePrevQuery");
  }
}

// Inserimento dello user nel db con una query protetta dai placeholder della libreria pg
// const text = `INSERT INTO users (username, email, password_hash) VALUES ($1 ,$2 ,$3 ) returning *`;
// const values = [ validateUser.username, validateUser.email, hash]
// const result = await pool.query( text, values);
export async function createUser(username, email, hash) {
  try {
    const pool = getPool();
    const text = `INSERT INTO users (username, email, password_hash) VALUES ($1 ,$2 ,$3 ) returning *`;
    const values = [username, email, hash];
    const result = await pool.query(text, values);
    return result;
  } catch {
    throw new Error("Error on createUser");
  }
}

// query per cercare l'utente dall email
// const query = await pool.query('SELECT * FROM users WHERE email = $1', [ validateUserLogin.email ])

export async function findUser(email) {
  try {
    const pool = getPool();
    return await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  } catch {
    throw new Error("Error on findUser");
  }
}
