import express from 'express'
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv'
import cors from 'cors';
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";
import { getPool } from './db/getPool.js';
import { startConsumer } from './consumer/ordersConsumer.js';
import { closeRedisClient } from './redis/redisClient.js';
import { closePool } from './db/getPool.js';

let server;
const port = 3020;

const app = express();

const pool = getPool();

dotenv.config();
// console.log(process.env)


app.use(cors({
  origin : ['http://localhost:3000','http://localhost','https://crud1.alematta.com'], //cors per il frontend per sviluppo locale e per nginx in produzione
  methods : [ 'GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  }
));

app.use(cookieParser());

// Middleware to authenticate requests using JWT, verify token, and extract user info
function JWT_middleware_decode(req, res, next) {
  // ora il token si trova nei cookie non serve piu estrarlo dall header
  // estraggo il token dall headers della richiesta
  // let token = req.headers.authorization?.split(' ')[1];
  const token = req.cookies.token;
  // console.log("token from middleware", token);
  if (!token)
    return res.status(401).json({ message: "Unauthorized token" });
  try {
      //Uso JWT verify per verificare il token
      let decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded === null || decoded === undefined)
          return res.status(401).json({ "message": "Unauthorized: Invalid or expired token" });
      req.user = decoded;
      //req.user now contains all users field like id username email ecc
      // console.log(req.user);
  } catch (error) {
      return res.status(401).json({ message : "Internal token", error_message: error})
  }
  // Passa al prossimo middleware
  next();
}



//libreria di node per leggere i file .env ( su python si usa os.environ.get("ENV_VARIABLE"))
// dotenv.config({ path: '/home/ale/Desktop/express_project_1/.env' })

// middleware logger - skip /health to avoid log noise
app.use(morgan('dev', {
  skip: (req, res) => req.url === '/health'
}));

// middleware che aggiunge vari header di sicurezza alla risposta HTTP
app.use(helmet());

// middleware impostato a livello globale
// serve per parsare il corpo(body) delle richieste in entrata quando sono in formato JSON
app.use(express.json());


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


//nuova home pubblica (tutti possono vedere cosa comprare)
app.get('/api/products/public/', async (req,res) =>
{
  try {
    const result = await pool.query(`SELECT * from products`);
    res.status(200).json(result.rows);
  } catch(err) {
    console.error("Home page error!")
    res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
  }
});

// nuova GET per recuperare tutti i prodotti personali da vendere
// (pagina /my-product) 
app.get('/api/products/', JWT_middleware_decode, async (req,res) =>
{
    // Devo creare una rotta get che esegua semplicemente la query che ho scritto sotto nel testPool
    // Ma devo gestire eventuali errori o il fatto che il db sia vuoto o spento
    try {
        let userId = req.user.userId;
        // console.log(userId)
        const result = await pool.query(`SELECT * from products WHERE user_id = $1`, [userId]);
        res.status(200).json(result.rows);
    } catch(err) {
            res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
    }
});

// nuova GET che serve a vedere tutti i prodotti che un utente mette in vendite (tutti tranne il suo id cioe quelli che lui mette in vendita)
// nuova pagina da loggato
app.get('/api/products/my-home/', JWT_middleware_decode, async (req,res) =>
{
    try {
        let userId = req.user.userId;
        // console.log(userId)
        const result = await pool.query(`SELECT * from products WHERE user_id != $1 AND quantity > 0 ORDER BY created_at DESC`, [userId]);
        res.status(200).json(result.rows);
    } catch(err) {
            res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
    }
});


//GET per recuperare un prodotto specifico (READ)
// aggiunta middleware JWT
app.get('/api/products/:id',JWT_middleware_decode, async (req,res) =>
{
    try {
        let id = parseInt(req.params.id);
        if(isNaN(id))
          return res.status(400).json({message: 'Bad Request, id is not a number.'});
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if(result.rowCount == 0)
          return res.status(404).json({message: 'Not found'})
        res.status(200).json(result.rows);
    } catch(err) {
        res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
    };
});

//POST per create un nuovo prodotto (CREATE)
//Update the endpoint to extract the user_id from the req.user
app.post('/api/products',JWT_middleware_decode, async (req, res) => {
  try {
    const product = req.body; // req.body parse the JSON to a JS object
    const logged_userId = req.user.userId; // extracted the userId of the logged user with the value saved by the middleware to req.user
    console.log(logged_userId);
    if (!product.name || product.name.trim() === "")
      return res.status(400).json({ error: "Product name required" })
    if (!product.price || isNaN(product.price)) // this is a number so we need to use isNaN 
      return res.status(400).json({ error: "Price must be a valid number" })
    if (!product.category || product.category.trim() === "")
      return res.status(400).json({ error: "Category name required" })
    if (product.quantity === undefined || isNaN(product.quantity) || product.quantity < 0)
      return res.status(400).json({ error: "Quantity must be a valid non-negative number" })
    const text = 'INSERT INTO products (name, price, category, user_id, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    // This is a simple SQL query that uses placeholders ($1, $2, $3, $4, $5) to prevent SQL injection.
    const values = [product.name, product.price, product.category, logged_userId, product.quantity];
    // 'values' is an array containing the data to be inserted into the database.
    const result = await pool.query( text, values); 
    return res.status(201).send({ message: "Product created" , product: result.rows[0] });
  } catch(err) {
    res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
  }
});

//PATCH per aggiornare un prodotto esistente (UPDATE)
app.patch('/api/products/:id', JWT_middleware_decode, async(req, res) => {
  try {
    let id = parseInt(req.params.id); //parse the id to a number 
    if (isNaN(id)) // if parseInt fails check for Nan
        return res.status(400).send("Id is not a number");
    let product = req.body; // body checks
    if (!('name' in product) && !('price' in product) && !('category' in product) && !('quantity' in product)) // at least one of this exist
      return res.status(400).json({ error: "Update at leas one value" });
    if (('name' in product) && product.name.trim() === "") //exist and is not empty
      return res.status(400).json({ message: 'Name must be a valid string'});
    if(('price' in product) && isNaN(product.price))
      return res.status(400).json({ message: 'Price must be a valid number'});
    if (('category' in product) && product.category.trim() === "")
      return res.status(400).json({ message: 'Category must be a valid string'});
    if(('quantity' in product) && (isNaN(product.quantity) || product.quantity < 0))
      return res.status(400).json({ message: 'Quantity must be a valid non-negative number'});

    //UPDATE QUERY PG STYLE 
    const field = [];
    const value = [];

    if ('name' in product)
    {
      value.push(product.name);
      field.push("name = $" + (value.length));
    }
    if ('price' in product) {
      value.push(product.price);
      field.push("price = $" + (value.length));
    }
    if ('category' in product)
    {
      value.push(product.category)
      field.push("category = $" + (value.length));
    }
    if ('quantity' in product)
    {
      value.push(product.quantity)
      field.push("quantity = $" + (value.length));
    }

    value.push(id); // need this also

    const text = `UPDATE products SET ${field.join(', ')} WHERE id = $${value.length} RETURNING * `;
    const result = await pool.query(text, value);
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Product not found'});
    return res.status(200).json({ message: 'Product updated!' , product: result.rows[0]})

  } catch(err) {
    res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
  }
});

// DELETE per cancellare un prodotto dato l'id specifico
app.delete('/api/products/:id', JWT_middleware_decode, async (req, res) => {
  try 
  {   
    let id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(400).send("Id is not a number");
    const result = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'No Product deleted'});
    // return res.status(204).send( "Product deleted"); // this could be ok too
    return res.status(200).json({ message: "Product deleted", product: result.rows[0]})
  } catch(err) {
    res.status(500).json({ message: 'Errore interno del server. Riprova più tardi.' });
  }
});

async function startServer() {
  await startConsumer();
  server = app.listen(port, () => {
    console.log(`Product-service listening on port ${port}`)
    console.log(`
      Route available:
      '/api/products         (GET) return all JSON value from DB (READ)
      '/api/products/:id     (GET) return a JSON of the specific id request from DB (READ)
      '/api/products         (POST) send JSON object and STORE it into DB (CREATE)
      '/api/products/:id     (PATCH) update the JSON object stored into the DB from the given id (UPDATE)
      '/api/products/:id     (DELETE) delete a product in the DB from the given id (DELETE)
      `)
    });
}

startServer().catch(err => {
  console.error("Failed to start:", err);
  process.exit(1);
})

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down...');
    
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Express: Server closed');
    }
    await closeRedisClient();
    await closePool();
    // chiudi anche pg se usi un pool
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);