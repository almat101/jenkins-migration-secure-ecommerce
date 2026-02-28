import { Router } from "express";
import { healthCheck } from "../controllers/healthController.js";

const healthRouter = Router();

healthRouter.get("/health", healthCheck);

export default healthRouter;
