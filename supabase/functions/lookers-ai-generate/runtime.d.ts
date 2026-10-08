// Minimal declarations for repository TypeScript checks; runtime is Supabase Deno.
declare module 'jsr:@supabase/functions-js/edge-runtime.d.ts';
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
