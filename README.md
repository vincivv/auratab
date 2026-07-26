# Tabscape

Chrome (Manifest V3) new-tab replacement with iOS-home-screen-style direct
manipulation of widgets over curated animated backgrounds and local
photo/video uploads.

- Product & technical spec: [`documentation/SPEC.md`](documentation/SPEC.md)
- Architecture rules & locked-in decisions: [`CLAUDE.md`](CLAUDE.md)
- Build progress against the spec's milestones: [`MILESTONES.md`](MILESTONES.md)

## Development

```sh
npm install
npm run dev
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load
unpacked** → select this project's `dist` folder after building, or point at
the Vite dev output per `@crxjs/vite-plugin`'s HMR workflow.

```sh
npm run build      # production build to dist/
npm run typecheck  # type-check without emitting
```
