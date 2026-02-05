export interface Promotion {
  name: string;
  type: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  priority: number;
}

export function isPromotionActive(promotion: Promotion, atDate?: Date): boolean {
  const checkDate = atDate || new Date();
  const validFrom = new Date(promotion.validFrom);
  const validUntil = new Date(promotion.validUntil);
  return checkDate >= validFrom && checkDate <= validUntil;
}
