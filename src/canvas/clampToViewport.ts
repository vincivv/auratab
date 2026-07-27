import { clamp } from '../lib/clamp'

/** Keeps a box's top-left corner within the visible canvas, given its current size. */
export function clampToViewport(
  x: number,
  y: number,
  w: number,
  h: number,
  bounds: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: clamp(x, 0, Math.max(0, bounds.width - w)),
    y: clamp(y, 0, Math.max(0, bounds.height - h)),
  }
}
