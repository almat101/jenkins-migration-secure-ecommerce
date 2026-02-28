// Importo Router
import { Router } from "express";
import {
  login,
  signup,
  demoLogin,
  checkIsAuth,
  logout,
} from "../controllers/authController.js";

// Definisco una costante router
const router = Router();

//endpoint per la registrazione /auth/signup
router.post("/signup", signup);

//creo la rotta con la chiamata al controller
//endpoint da chiamare localhost:3030/auth/login
router.post("/login", login);

router.get("/demo", demoLogin);

router.get("/checkIsAuth", checkIsAuth);

router.post("/logout", logout);

//esporto il router per prenderlo in app.js
export default router;
