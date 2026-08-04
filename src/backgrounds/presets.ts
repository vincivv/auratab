export interface BackgroundPreset {
  id: string
  name: string
  css: string
}

/**
 * Static curated gradients — not the spec's §4.4/§6.5 generative animated
 * engines (still not built, see README's "What's next"), just a first,
 * simpler pass at a background picker per explicit user direction. Palette
 * choices made freely, no brand reference given (see CLAUDE.md).
 *
 * 'aurora' is byte-for-byte the gradient .canvas has always hardcoded, kept
 * first in the list and as DEFAULT_PREFERENCES.background's id, so existing
 * users see zero visual change until they open this new picker.
 */
export const backgroundPresets: BackgroundPreset[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    css: 'radial-gradient(at 15% 20%, #6d5dfc 0%, transparent 55%), radial-gradient(at 85% 15%, #46c8f0 0%, transparent 50%), radial-gradient(at 50% 90%, #ff6b9d 0%, transparent 55%), #12101c',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    css: 'radial-gradient(at 20% 15%, #ff9d6c 0%, transparent 55%), radial-gradient(at 80% 25%, #ff5e7e 0%, transparent 50%), radial-gradient(at 50% 90%, #6a3093 0%, transparent 55%), #1a1023',
  },
  {
    id: 'forest',
    name: 'Forest',
    css: 'radial-gradient(at 15% 20%, #3fae6a 0%, transparent 55%), radial-gradient(at 85% 20%, #8fd694 0%, transparent 50%), radial-gradient(at 50% 90%, #1a5276 0%, transparent 55%), #0d1b14',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    css: 'radial-gradient(at 15% 20%, #1e90c3 0%, transparent 55%), radial-gradient(at 85% 15%, #37e0c4 0%, transparent 50%), radial-gradient(at 50% 90%, #0b3d66 0%, transparent 55%), #071427',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    css: 'radial-gradient(at 20% 20%, #3a2f7a 0%, transparent 55%), radial-gradient(at 80% 20%, #5e4b9e 0%, transparent 50%), radial-gradient(at 50% 90%, #14103a 0%, transparent 55%), #05040d',
  },
  {
    id: 'mono',
    name: 'Mono',
    css: 'radial-gradient(at 25% 25%, #3a3a42 0%, transparent 55%), radial-gradient(at 80% 20%, #55555f 0%, transparent 50%), radial-gradient(at 50% 90%, #1c1c22 0%, transparent 55%), #0a0a0d',
  },
]
