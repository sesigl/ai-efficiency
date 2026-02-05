import Fastify from "fastify";

export function createApp() {
  const fastify = Fastify({
    logger: true,
  });

  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  return fastify;
}

async function main() {
  const fastify = createApp();

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
