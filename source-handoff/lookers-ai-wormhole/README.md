# Lookers AI — Wormhole Preview (source handoff)

Original, unmodified source of the completed Wormhole Preview, kept here as an
isolated package. It is **not** wired into the React application, the build,
the Homepage or the Lookers AI backend.

## Provenance

- Recovered from the published Claude artifact "Wormhole Preview":
  https://claude.ai/artifact/7D4fKXKv5g4WqL19oqmR23 (version `1793143102-09cc`)
- The original scratchpad folder (`.../scratchpad/preview-wormhole/`) and
  `lookers-ai-wormhole-final.zip` no longer exist; the published artifact
  holds the same complete export.
- Every file is byte-identical to the published version. `MANIFEST.sha256`
  lists the SHA-256 of each file as reported by the artifact service.
- The older `/tmp/claude-0/wh/wormhole.js` implementation is **not** included.

## Contents

| Path | Role |
| --- | --- |
| `index.html` | Preview page, including the final `startWormhole()` implementation |
| `lookers-motion.js` / `lookers-motion.css` | Lookers Hub Motion Kit v1.0 |
| `lookershub-mark.webp` | Lookers Hub mark |
| `space/eye-tex.webp`, `space/eye-outer.svg`, `space/eye-inner.svg` | Wormhole eye |
| `space/{design,business,technology,presentations,marketing}-{sphere,ring-front,ring-back}.webp` | Planets |
| `space/asteroid-0..7.webp`, `space/rock-0..3.webp` | Asteroids and rocks |

All asset paths are relative to this folder and must keep this layout.

## Viewing locally

Serve this folder with any static server, e.g.
`npx serve source-handoff/lookers-ai-wormhole`, then open the root URL.
The page loads Google Fonts (Almarai, Cormorant Garamond, Outfit) from the network.

## Verify integrity

```sh
cd source-handoff/lookers-ai-wormhole && sha256sum -c MANIFEST.sha256
```
