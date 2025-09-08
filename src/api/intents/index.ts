import { Hono } from 'hono';
import get from './get';
import post from './post';
import { verifyJwtMW } from '../_cmn/verify_jwt';
import { createSupabaseSessMW } from '../_cmn/create_supasess';

const app_intents = new Hono();

app_intents.get('/', get);
app_intents.post('/', verifyJwtMW, createSupabaseSessMW, post);

export default app_intents;
