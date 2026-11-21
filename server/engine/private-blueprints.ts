import { bounded } from '../../core/agent/bounded.ts';
import type { Blueprint } from '../../core/mission-engine/types.ts';

/**
 * The blueprints live in a locked table (`lookers_engine_blueprints`): RLS on, no policy,
 * so anon and authenticated callers get nothing at all. The function reads them with the
 * service key and caches them for a few minutes, so new missions go live by updating one
 * row — no redeploy, and nothing published anywhere.
 *
 * The old loader fetched a pinned file over the public internet and checked its SHA-256,
 * because a public URL can be swapped under you. This payload never leaves our own
 * database, so the lockdown is the integrity guarantee; what is checked here is the shape,
 * so a half-written upload cannot take the engine down quietly.
 */
export type BlueprintSource = (id: string) => Promise<Blueprint | undefined>;

/** A usable blueprint carries its id and the private half the browser never sees. */
const usable = (bp: unknown): boolean =>
  !!bp && typeof bp === 'object'
  && typeof (bp as { id?: unknown }).id === 'string'
  && typeof (bp as { role?: unknown }).role === 'string'
  && !!(bp as { strategy?: unknown }).strategy
  && Array.isArray((bp as { gates?: unknown }).gates);

export function privateBlueprints(
  supabaseUrl: string,
  serviceKey: string,
  transport: typeof fetch = fetch,
  ttlMs = 5 * 60_000,
  now = () => Date.now(),
): BlueprintSource {
  let cache: { at: number; byId: Map<string, Blueprint> } | null = null;
  let inflight: Promise<Map<string, Blueprint>> | null = null;

  const load = async (): Promise<Map<string, Blueprint>> => {
    if (!supabaseUrl || !serviceKey) throw new Error('blueprints_unconfigured');
    return await bounded(async signal => {
      const res = await transport(`${supabaseUrl}/rest/v1/lookers_engine_blueprints?id=eq.current&select=payload,count`, {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, Accept: 'application/json' },
        signal, redirect: 'error',
      });
      if (!res.ok) throw new Error('blueprints_unavailable');
      const rows: unknown = await res.json();
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (!row || !Array.isArray(row.payload) || row.payload.length === 0) throw new Error('blueprints_missing');
      if (!row.payload.every(usable)) throw new Error('blueprints_malformed');
      const list = row.payload as Blueprint[];
      return new Map(list.map(bp => [bp.id, bp] as const));
    }, 8000);
  };

  return async (id: string) => {
    if (cache && now() - cache.at < ttlMs) return cache.byId.get(id);
    if (!inflight) {
      inflight = load()
        .then(byId => { cache = { at: now(), byId }; return byId; })
        .finally(() => { inflight = null; });
    }
    try {
      return (await inflight).get(id);
    } catch (error) {
      // A stale copy is better than a dead engine; only fail when there is nothing cached.
      if (cache) return cache.byId.get(id);
      throw error;
    }
  };
}
