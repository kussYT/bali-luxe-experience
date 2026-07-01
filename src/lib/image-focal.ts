import type { Product } from "@/lib/catalog-types";

export type ImageFocal = { x: number; y: number };

export const DEFAULT_IMAGE_FOCAL: ImageFocal = { x: 50, y: 50 };

export function focalObjectPosition(focal?: Partial<ImageFocal> | null) {
  const x = focal?.x ?? DEFAULT_IMAGE_FOCAL.x;
  const y = focal?.y ?? DEFAULT_IMAGE_FOCAL.y;
  return `${x}% ${y}%`;
}

export function productObjectPosition(product: Pick<Product, "imageFocal">) {
  return focalObjectPosition(product.imageFocal);
}
