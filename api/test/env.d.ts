import type { Env } from '../src/env';

declare module 'cloudflare:test' {
  // env dari cloudflare:test bertipe binding worker kita
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProvidedEnv extends Env {}
}
