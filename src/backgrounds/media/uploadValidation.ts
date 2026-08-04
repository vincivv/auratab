/** ~25MB image ceiling — spec explicitly deferred the exact number (FR-22); this is where that decision lives (see CLAUDE.md). */
export const MAX_BACKGROUND_IMAGE_BYTES = 25 * 1024 * 1024

export function validateBackgroundImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > MAX_BACKGROUND_IMAGE_BYTES) return 'That image is too large — max 25MB.'
  return null
}
