import fastify from "fastify";
import type { FastifyInstance } from "fastify";

export function createApp() {
  const server = fastify({
    logger: false,
  });

  server.get("/health", async (_request, _reply) => {
    return { status: "ok" };
  });

  return { fastify: server };
}

const start = async () => {
  try {
    const { fastify: server } = createApp();
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
