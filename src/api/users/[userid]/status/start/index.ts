import { Hono } from 'hono';
import post from './post';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';

const app_users_userid_status_start = new Hono();

app_users_userid_status_start.post('/', verifyJwtMW, createSupabaseSessMW, post);

export default app_users_userid_status_start;
