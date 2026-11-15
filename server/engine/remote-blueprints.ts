import type { Blueprint } from '../../core/mission-engine/types.ts';

/**
 * Loads server/engine/blueprints.json from a pinned commit and verifies its SHA-256.
 * A pinned commit is immutable, so the hash check guarantees the exact reviewed blueprints run.
 * Cached per function instance. Used by the deployed function until CI deploys full bundles.
 */
export function remoteBlueprints(url: string, sha256: string, transport: typeof fetch = fetch) {
  let cache: Promise<Map<string, Blueprint>> | undefined;
  const load = async () => {
    const res = await transport(url, { redirect: 'error' });
    if (!res.ok) throw new Error('blueprints_unavailable');
    const bytes = await res.arrayBuffer();
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
    if (digest !== sha256) throw new Error('blueprints_integrity');
    const list = JSON.parse(new TextDecoder().decode(bytes)) as Blueprint[];
    return new Map(list.map(bp => [bp.id, bp] as const));
  };
  return async (id: string): Promise<Blueprint | undefined> => {
    cache ??= load().catch(error => { cache = undefined; throw error; });
    return (await cache).get(id);
  };
}
