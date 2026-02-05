import { createApp } from "../../src/index.js";
import type { FastifyInstance } from "fastify";

const itemsBasePath = "/items";

export async function createTestApp(): Promise<FastifyInstance> {
  const { fastify } = createApp();
  await fastify.ready();
  return fastify;
}

export function itemUrl(sku: string, suffix?: string): string {
  const baseUrl = `${itemsBasePath}/${sku}`;
  if (!suffix) {
    return baseUrl;
  }
  const normalizedSuffix = suffix.startsWith("/") ? suffix.slice(1) : suffix;
  return `${baseUrl}/${normalizedSuffix}`;
}

export function itemPromotionUrl(sku: string, promotionName: string): string {
  return itemUrl(sku, `promotions/${encodeURIComponent(promotionName)}`);
}

export function futureDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export function promotionDates(
  startDaysFromNow: number = -1,
  endDaysFromNow: number = 30,
): { validFrom: string; validUntil: string } {
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() + startDaysFromNow);

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + endDaysFromNow);

  return { validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString() };
}

export function pastPromotionDates(): { validFrom: string; validUntil: string } {
  const validFrom = new Date();
  validFrom.setDate(validFrom.getDate() - 30);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() - 1);
  return { validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString() };
}
