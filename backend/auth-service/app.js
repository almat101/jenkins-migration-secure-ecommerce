import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost",
      "https://crud1.alematta.com",
    ], //cors per il frontend per sviluppo locale e per nginx in produzione
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true, // important to allow cookies to be sent and received
  })
);

app.use(cookieParser());

// middleware logger - skip /health to avoid log noise
app.use(
  morgan("dev", {
    skip: (req) => req.url === "/health",
  })
);

// middleware che aggiunge vari header di sicurezza alla risposta HTTP
app.use(helmet());

// Parsa il corpo(body) delle richieste in entrata quando sono in formato JSON
app.use(express.json());

// rotta test
// app.get('/', async (req, res) => {
//   res.send('Hello auth-service!');
// });

app.get("/test-cookies", (req, res) => {
  console.log("Cookies:", req.cookies); // Print cookies to the console
  res.json({ cookies: req.cookies }); // Return cookies in the response for testing
});

// Collego il router di autenticazione aggiungo /auth in modo da dover chiamare solo /auth/signup e auth/login
app.use("/auth", authRoutes);

app.get("/health", healthRoutes);

export default app;
