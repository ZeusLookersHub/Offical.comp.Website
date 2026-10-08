export const PROVIDER_ERROR_CODES = ['provider_unavailable', 'provider_auth_failed', 'provider_insufficient_balance',
  'provider_rate_limited', 'provider_timeout', 'provider_network_failed', 'invalid_provider_response', 'invalid_ai_request', 'provider_aborted'] as const;
export type ProviderErrorCode = typeof PROVIDER_ERROR_CODES[number];
export class ProviderError extends Error {
  constructor(readonly code: ProviderErrorCode) { super(code); this.name = 'ProviderError'; }
}
export const statusCode = (status: number): ProviderErrorCode => status === 401 ? 'provider_auth_failed' :
  status === 402 ? 'provider_insufficient_balance' : status === 429 ? 'provider_rate_limited' : 'provider_unavailable';
/** Compatibility with the actual original adapter's HTTP exception. */
export class ProviderRequestError extends Error {
  constructor(readonly status: number) { super('provider_request_failed'); }
}
export const normalizeError = (error: unknown): ProviderError => error instanceof ProviderError ? error :
  error instanceof ProviderRequestError ? new ProviderError(statusCode(error.status)) :
  error instanceof Error && error.message === 'invalid_provider_response' ? new ProviderError('invalid_provider_response') :
  error instanceof Error && error.name === 'TimeoutError' ? new ProviderError('provider_timeout') : new ProviderError('provider_unavailable');
