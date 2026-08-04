/** What .canvas's background currently renders — a curated CSS gradient, or
 * a user-uploaded image (the blob itself lives in IndexedDB, see
 * media/backgroundMediaStore.ts; only this small tag is persisted in
 * preferences via chrome.storage.local).
 *
 * 'custom' carries `updatedAt` even though the IndexedDB key never changes
 * (still a single fixed slot) — re-uploading over an existing custom image
 * keeps `type: 'custom'` unchanged, so without something that *does* change,
 * useBackgroundStyle's effect (keyed on the selection) would have no signal
 * to reload the new blob and would keep showing the old object URL. */
export type BackgroundSelection = { type: 'preset'; id: string } | { type: 'custom'; updatedAt: number }
