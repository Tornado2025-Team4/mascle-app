import { Hono } from 'hono';
import get from './get';
import post from './post';
import { verifyJwtMW } from '../_cmn/verify_jwt';
import { createSupabaseSessMW } from '../_cmn/create_supasess';

const app_bodyparts = new Hono();

app_bodyparts.get('/', get);
app_bodyparts.post('/', verifyJwtMW, createSupabaseSessMW, post);

export default app_bodyparts;
