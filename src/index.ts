import fastify from "fastify";

// Create Fastify server instance
const server = fastify({
  logger: true,
});

// Example: Wire up a simple noop endpoint
// This demonstrates the basic pattern for adding endpoints
server.get("/health", async (request, reply) => {
  // This is a simple noop endpoint that returns a status
  return { status: "ok" };
});

// Example: Another noop endpoint to demonstrate the pattern
server.get("/noop", async (request, reply) => {
  // A true noop - does nothing and returns empty response
  return {};
});

// Start the server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
