import type { Blueprint } from '../../core/mission-engine/types.ts';

export type Pin = { url: string; sha256: string };
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/**
 * Loads server/engine/blueprints.json from a pinned commit and verifies its SHA-256.
 * The pin comes from `resolvePin` (the lookers_engine_config table), re-checked every `ttlMs`,
 * so new blueprints go live with a commit + a one-row update — no function redeploy.
 * If the pin cannot be read, the last good pin (or the embedded fallback) keeps serving.
 */
export function remoteBlueprints(resolvePin: () => Promise<Pin>, fallback: Pin, transport: typeof fetch = fetch, ttlMs = 5 * 60_000, now = () => Date.now()) {
  let pin = fallback;
  let pinCheckedAt = -Infinity;
  let loaded: { sha: string; map: Promise<Map<string, Blueprint>> } | undefined;

  const load = (p: Pin) => (async () => {
    const res = await transport(p.url, { redirect: 'error' });
    if (!res.ok) throw new Error('blueprints_unavailable');
    const bytes = await res.arrayBuffer();
    if (hex(await crypto.subtle.digest('SHA-256', bytes)) !== p.sha256) throw new Error('blueprints_integrity');
    const list = JSON.parse(new TextDecoder().decode(bytes)) as Blueprint[];
    return new Map(list.map(bp => [bp.id, bp] as const));
  })();

  return async (id: string): Promise<Blueprint | undefined> => {
    if (now() - pinCheckedAt > ttlMs) {
      pinCheckedAt = now();
      try {
        const next = await resolvePin();
        if (typeof next?.url === 'string' && /^[0-9a-f]{64}$/.test(next.sha256 ?? '')) pin = next;
      } catch { /* keep the last good pin */ }
    }
    if (!loaded || loaded.sha !== pin.sha256) {
      const previous = loaded;
      const current = { sha: pin.sha256, map: load(pin) };
      loaded = current;
      current.map.catch(() => { if (loaded === current) loaded = previous; });
    }
    return (await loaded.map).get(id);
  };
}

/** Reads the pin row through PostgREST with the public key (the table is read-only to clients). */
export const pinFromConfig = (url: string, anonKey: string, transport: typeof fetch = fetch) => async (): Promise<Pin> => {
  const res = await transport(`${url}/rest/v1/lookers_engine_config?key=eq.blueprints&select=value`, {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey }, redirect: 'error',
  });
  if (!res.ok) throw new Error('config_unavailable');
  const rows = await res.json() as { value: Pin }[];
  if (!rows[0]?.value) throw new Error('config_missing');
  return rows[0].value;
};
