import { Router } from '../../lib';

const router = new Router();

const swagger = { examples: { 'curl localhost:8877/check': { ok: 1 } } };

export default router.tag('system').get(
  '/check',
  (ctx) => {
    ctx.body = { ok: 1 };
  },
  swagger,
);
