import { testDatabaseConnection } from "../repositories/authRepository.js";

export const healthCheck = async (req, res) => {
  try {
    await testDatabaseConnection();
    res.status(200).json({
      status: "ok",
      check: {
        app: "running",
        database: "connected",
      },
    });
  } catch (error) {
    console.error("Health check failed: ", error);
    res.status(500).json({
      status: "error",
      check: {
        app: "running",
        database: "disconnected",
      },
    });
  }
};
