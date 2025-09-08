import { Hono } from 'hono';
import get from './get';
import post from './post';
import { verifyJwtMW } from '../_cmn/verify_jwt';
import { createSupabaseSessMW } from '../_cmn/create_supasess';

const app_tags = new Hono();

app_tags.get('/', get);
app_tags.post('/', verifyJwtMW, createSupabaseSessMW, post);

export default app_tags;
