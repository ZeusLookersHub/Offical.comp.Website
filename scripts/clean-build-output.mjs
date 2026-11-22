/**
 * Clears the build's own files out of docs/ before Vite writes new ones.
 *
 * docs/ is both the published site root and where the project's written documentation lives, so
 * Vite's emptyOutDir would delete the markdown alongside the old bundle — a build quietly removes
 * committed docs from the working tree, and the next careless commit removes them from the repo.
 * Only what a build produces is removed here: the hashed assets and the generated index.html.
 */
import { rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const out = 'docs';
const generated = new Set(['index.html']);

const assets = join(out, 'assets');
await rm(assets, { recursive: true, force: true });
for (const name of await readdir(out).catch(() => [])) {
  if (generated.has(name)) await rm(join(out, name), { force: true });
}
