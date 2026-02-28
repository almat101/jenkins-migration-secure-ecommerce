
import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

// Middleware per decodificare JWT
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  // Skip per health check e ping
  if (request.url.startsWith('/health') || request.url.startsWith('/ping')) {
    return;
  }

  const token = request.cookies.token;
  // console.log("token: ", token);
  if (!token) {
    return reply.code(401).send({ message: "Unauthorized: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    request.user = decoded as { userId: number; username: string; email: string };
  } catch (error) {
    return reply.code(401).send({ message: "Unauthorized: Invalid token" });
  }
};