export type ShrinkageReason = "damaged" | "expired" | "theft";

const VALID_REASONS: ShrinkageReason[] = ["damaged", "expired", "theft"];

export function validateShrinkageReason(value: string): ShrinkageReason {
  if (!VALID_REASONS.includes(value as ShrinkageReason)) {
    throw new Error(
      `Invalid shrinkage reason: ${value}. Must be one of: ${VALID_REASONS.join(", ")}`,
    );
  }
  return value as ShrinkageReason;
}
