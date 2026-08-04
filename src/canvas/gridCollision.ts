export interface CellRect {
  col: number
  row: number
  w: number
  h: number
}

function rectsOverlap(a: CellRect, b: CellRect): boolean {
  return a.col < b.col + b.w && a.col + a.w > b.col && a.row < b.row + b.h && a.row + a.h > b.row
}

const MAX_PASSES = 50

/**
 * Push/displace collision resolution — this is the "grid reflow" spec §5.4
 * and §10 explicitly deferred as higher-risk/post-launch scope, built now
 * anyway per explicit user direction (see MILESTONES.md 2026-07-29).
 *
 * Given a moved/resized/newly-added widget's target rect, pushes any other
 * widget it now overlaps out of the way vertically, cascading if that push
 * causes a new overlap further along. Down is tried first (the original,
 * more-tested behavior) since it reads as the more natural "make room"
 * direction; if there's no room below (would push past the last row), it
 * falls back to pushing up above the widget causing the overlap instead —
 * added 2026-08-03 after this showed up in practice: widgets dragged near
 * the bottom of the viewport had nowhere to go and were left overlapping.
 * Still never sideways or to "nearest empty spot" — simpler to reason about
 * and keeps the algorithm bounded and predictable.
 *
 * If *neither* direction has room, the overlap is left in place — there's
 * no vertical scroll to push into (the canvas is a fixed viewport), so this
 * is a deliberate limit, not a bug. `movedId`'s own rect is never pushed —
 * it only causes pushes.
 */
export function resolveGridCollisions(
  movedId: string,
  targetRect: CellRect,
  others: { id: string; rect: CellRect }[],
  gridRows: number,
): { id: string; rect: CellRect }[] {
  const entries: { id: string; rect: CellRect }[] = [
    { id: movedId, rect: targetRect },
    ...others.map((o) => ({ id: o.id, rect: { ...o.rect } })),
  ]

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false

    for (let i = 1; i < entries.length; i++) {
      const current = entries[i]
      for (let j = 0; j < entries.length; j++) {
        if (j === i) continue
        const other = entries[j]
        if (!rectsOverlap(current.rect, other.rect)) continue

        const pushedDownRow = other.rect.row + other.rect.h
        const pushedUpRow = other.rect.row - current.rect.h

        if (pushedDownRow !== current.rect.row && pushedDownRow + current.rect.h <= gridRows) {
          current.rect = { ...current.rect, row: pushedDownRow }
          changed = true
          break
        }
        if (pushedUpRow !== current.rect.row && pushedUpRow >= 0) {
          current.rect = { ...current.rect, row: pushedUpRow }
          changed = true
          break
        }
        // No room in either direction — leave this overlap in place.
      }
    }

    if (!changed) break
  }

  return entries
}
