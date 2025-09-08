import { Hono } from 'hono';
import app_dm_pairs from './pairs';
import { verifyJwtMW } from '../_cmn/verify_jwt';
import { createSupabaseSessMW } from '../_cmn/create_supasess';

const app_dm = new Hono();

app_dm.use(verifyJwtMW, createSupabaseSessMW);

app_dm.route('/pairs', app_dm_pairs);

export default app_dm;