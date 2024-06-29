import { Routings } from "../Routings";

const status = new Routings();

status.get('/status', async (c: any) => c.set('result', { ok: 1 }));

export { status };
