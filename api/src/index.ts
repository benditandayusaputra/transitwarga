import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DATA_VERSION } from './data/agregat';
import { securityHeaders } from './middleware/securityHeaders';
import { chatRoute } from './routes/chat';
import { summaryRoute } from './routes/summary';
import type { Env } from './env';

export type { Env } from './env';
export { RateLimiter } from './rateLimiter';

const app = new Hono<{ Bindings: Env }>();

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

app.use('/api/*', async (c, next) => {
  const allowed = c.env.CORS_ORIGIN ? [c.env.CORS_ORIGIN, ...DEV_ORIGINS] : DEV_ORIGINS;
  return cors({
    origin: allowed,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400
  })(c, next);
});
app.use('/api/*', securityHeaders);

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    data_version: DATA_VERSION,
    llm: {
      provider: c.env.LLM_PROVIDER ?? 'unset',
      model: c.env.LLM_MODEL ?? 'unset'
    }
  })
);

app.route('/', summaryRoute);
app.route('/', chatRoute);

export default app;
