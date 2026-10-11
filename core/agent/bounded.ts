export class BoundedError extends Error {
  constructor(readonly code: 'timeout' | 'aborted') { super(code); }
}
/** One attempt, cancellation-aware. Timers are always released; late results are ignored. */
export async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number, parent?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void;
  try {
    if (parent?.aborted) throw new BoundedError('aborted');
    return await Promise.race([
      Promise.resolve().then(() => {
        if (controller.signal.aborted) throw new BoundedError('aborted');
        return operation(controller.signal);
      }),
      new Promise<never>((_, reject) => {
        onAbort = () => { controller.abort(); reject(new BoundedError('aborted')); };
        parent?.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(() => { controller.abort(); reject(new BoundedError('timeout')); }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener('abort', onAbort!);
    controller.abort();
  }
}
