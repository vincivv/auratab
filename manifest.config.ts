import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'AuraTab',
  description: 'Your new tab, rearranged like your home screen.',
  version: pkg.version,
  icons: {
    16: 'public/icons/icon16.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  chrome_url_overrides: {
    newtab: 'index.html',
  },
  permissions: ['storage', 'unlimitedStorage'],
})
