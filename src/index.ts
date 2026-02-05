import fastify from "fastify";
import { fileURLToPath } from "node:url";

interface Reservation {
  reservationId: string;
  quantity: number;
  expiresAt: string;
}

interface InventoryItem {
  sku: string;
  quantity: number;
  reservations: Reservation[];
}

interface Promotion {
  name: string;
  type: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  priority?: number;
}

interface PriceEntry {
  sku: string;
  basePriceInCents: number;
  currency: string;
  promotions: Promotion[];
}

type AvailabilityLevel = "HIGH" | "LOW" | "OUT_OF_STOCK";

interface Availability {
  sku: string;
  level: AvailabilityLevel;
  isLow: boolean;
  isOutOfStock: boolean;
}

interface PriceCalculation {
  basePriceInCents: number;
  finalPriceInCents: number;
  totalDiscountPercentage: number;
  appliedDiscounts: Array<{
    name: string;
    type: string;
    originalPercentage: number;
    appliedPercentage: number;
    reason: string;
  }>;
}

const lowStockThreshold = 5;

const buildAvailability = (sku: string, item?: InventoryItem): Availability => {
  const availableQuantity = item
    ? item.quantity -
      item.reservations.reduce((total, reservation) => total + reservation.quantity, 0)
    : 0;

  if (availableQuantity <= 0) {
    return {
      sku,
      level: "OUT_OF_STOCK",
      isLow: false,
      isOutOfStock: true,
    };
  }

  if (availableQuantity <= lowStockThreshold) {
    return {
      sku,
      level: "LOW",
      isLow: true,
      isOutOfStock: false,
    };
  }

  return {
    sku,
    level: "HIGH",
    isLow: false,
    isOutOfStock: false,
  };
};

const calculateAvailableQuantity = (item: InventoryItem): number =>
  item.quantity - item.reservations.reduce((total, reservation) => total + reservation.quantity, 0);

const resolveCurrency = (incoming: string | undefined, existing?: string): string =>
  incoming ?? existing ?? "USD";

const parseCalculationDate = (value: unknown): Date => {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const isPromotionActive = (promotion: Promotion, date: Date): boolean => {
  const validFrom = new Date(promotion.validFrom);
  const validUntil = new Date(promotion.validUntil);
  return validFrom <= date && date <= validUntil;
};

const resolveDiscount = (
  availability: Availability,
  promotion: Promotion,
): { appliedPercentage: number; reason: string } => {
  if (availability.level === "OUT_OF_STOCK") {
    return { appliedPercentage: 0, reason: "No discount: item out of stock" };
  }

  if (availability.level === "LOW") {
    return {
      appliedPercentage: promotion.discountPercentage / 2,
      reason: "Reduced discount: low stock",
    };
  }

  return {
    appliedPercentage: promotion.discountPercentage,
    reason: "Full discount applied",
  };
};

export const createApp = (): { fastify: ReturnType<typeof fastify> } => {
  const fastifyInstance = fastify({ logger: true });
  const inventory = new Map<string, InventoryItem>();
  const priceEntries = new Map<string, PriceEntry>();

  fastifyInstance.get("/health", async () => ({ status: "ok" }));

  fastifyInstance.post("/stock/add", async (request, reply) => {
    const { sku, quantity } = request.body as { sku: string; quantity: number };
    if (quantity === 0) {
      return reply.status(400).send({ error: "Cannot add zero quantity" });
    }

    const item = inventory.get(sku) ?? { sku, quantity: 0, reservations: [] };
    item.quantity += quantity;
    inventory.set(sku, item);

    return reply.status(204).send();
  });

  fastifyInstance.post("/stock/remove", async (request, reply) => {
    const { sku, quantity } = request.body as { sku: string; quantity: number };
    const item = inventory.get(sku);
    if (!item) {
      return reply.status(400).send({ error: "Inventory item not found" });
    }

    if (quantity > calculateAvailableQuantity(item)) {
      return reply.status(400).send({ error: "Insufficient available stock" });
    }

    item.quantity -= quantity;
    return reply.status(204).send();
  });

  fastifyInstance.post("/reservations", async (request, reply) => {
    const { sku, reservationId, quantity, expiresAt } = request.body as Reservation & {
      sku: string;
    };
    const item = inventory.get(sku);
    if (!item) {
      return reply.status(400).send({ error: "Inventory item not found" });
    }

    if (quantity > calculateAvailableQuantity(item)) {
      return reply.status(400).send({ error: "Insufficient available stock for reservation" });
    }

    item.reservations.push({ reservationId, quantity, expiresAt });
    return reply.status(201).send({ reservationId, quantity });
  });

  fastifyInstance.delete("/reservations/:sku/:reservationId", async (request, reply) => {
    const { sku, reservationId } = request.params as { sku: string; reservationId: string };
    const item = inventory.get(sku);
    if (item) {
      item.reservations = item.reservations.filter(
        (reservation) => reservation.reservationId !== reservationId,
      );
    }
    return reply.status(204).send();
  });

  fastifyInstance.get("/inventory/:sku", async (request, reply) => {
    const { sku } = request.params as { sku: string };
    const item = inventory.get(sku);
    if (!item) {
      return reply.status(404).send({ error: "Inventory item not found" });
    }

    return reply.send({
      sku: item.sku,
      quantity: item.quantity,
      availableQuantity: calculateAvailableQuantity(item),
      reservations: item.reservations,
    });
  });

  fastifyInstance.get("/availability/:sku", async (request, reply) => {
    const { sku } = request.params as { sku: string };
    const item = inventory.get(sku);
    const availability = buildAvailability(sku, item);
    return reply.send(availability);
  });

  fastifyInstance.post("/prices/base", async (request, reply) => {
    const { sku, priceInCents, currency } = request.body as {
      sku: string;
      priceInCents: number;
      currency?: string;
    };

    if (priceInCents === 0) {
      return reply.status(400).send({ error: "Base price cannot be zero" });
    }

    const existingEntry = priceEntries.get(sku);
    const entry: PriceEntry = {
      sku,
      basePriceInCents: priceInCents,
      currency: resolveCurrency(currency, existingEntry?.currency),
      promotions: existingEntry?.promotions ?? [],
    };
    priceEntries.set(sku, entry);
    return reply.status(204).send();
  });

  fastifyInstance.post("/prices/promotions", async (request, reply) => {
    const promotion = request.body as Promotion & { sku: string };
    const entry = priceEntries.get(promotion.sku);
    if (!entry) {
      return reply.status(400).send({ error: "Price entry not found" });
    }

    if (entry.promotions.some((existing) => existing.name === promotion.name)) {
      return reply.status(400).send({ error: "Promotion already exists" });
    }

    const newPromotion: Promotion = {
      name: promotion.name,
      type: promotion.type,
      discountPercentage: promotion.discountPercentage,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
    };

    if (promotion.priority !== undefined) {
      newPromotion.priority = promotion.priority;
    }

    entry.promotions.push(newPromotion);

    return reply.status(204).send();
  });

  fastifyInstance.delete("/prices/promotions/:sku/:promotionName", async (request, reply) => {
    const { sku, promotionName } = request.params as { sku: string; promotionName: string };
    const entry = priceEntries.get(sku);
    if (entry) {
      entry.promotions = entry.promotions.filter((promotion) => promotion.name !== promotionName);
    }
    return reply.status(204).send();
  });

  fastifyInstance.get("/prices/entries/:sku", async (request, reply) => {
    const { sku } = request.params as { sku: string };
    const entry = priceEntries.get(sku);
    if (!entry) {
      return reply.status(404).send({ error: "Price entry not found" });
    }
    return reply.send(entry);
  });

  fastifyInstance.get("/prices/calculate/:sku", async (request, reply) => {
    const { sku } = request.params as { sku: string };
    const entry = priceEntries.get(sku);
    if (!entry) {
      return reply.status(404).send({ error: "Price entry not found" });
    }

    const calculationDate = parseCalculationDate(
      (request.query as { at?: string } | undefined)?.at,
    );
    const availability = buildAvailability(sku, inventory.get(sku));
    const activePromotions = entry.promotions.filter((promotion) =>
      isPromotionActive(promotion, calculationDate),
    );

    if (activePromotions.length === 0) {
      const response: PriceCalculation = {
        basePriceInCents: entry.basePriceInCents,
        finalPriceInCents: entry.basePriceInCents,
        totalDiscountPercentage: 0,
        appliedDiscounts: [],
      };
      return reply.send(response);
    }

    const appliedDiscounts = activePromotions.map((promotion) => {
      const discount = resolveDiscount(availability, promotion);
      return {
        name: promotion.name,
        type: promotion.type,
        originalPercentage: promotion.discountPercentage,
        appliedPercentage: discount.appliedPercentage,
        reason: discount.reason,
      };
    });

    const totalDiscountPercentage = appliedDiscounts.reduce(
      (total, discount) => total + discount.appliedPercentage,
      0,
    );
    const finalPriceInCents = Math.round(
      entry.basePriceInCents * (1 - totalDiscountPercentage / 100),
    );

    const response: PriceCalculation = {
      basePriceInCents: entry.basePriceInCents,
      finalPriceInCents,
      totalDiscountPercentage,
      appliedDiscounts,
    };

    return reply.send(response);
  });

  return { fastify: fastifyInstance };
};

const start = async (): Promise<void> => {
  const { fastify: fastifyInstance } = createApp();
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";

    await fastifyInstance.listen({ port, host });
    console.log(`Server is running on http://${host}:${port}`);
  } catch (error) {
    fastifyInstance.log.error(error);
    process.exit(1);
  }
};

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  void start();
}
