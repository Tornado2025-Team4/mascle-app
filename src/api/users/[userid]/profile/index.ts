import { Hono } from 'hono';
import get from './get';
import patch from './patch';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';

const app_users_userid_profile = new Hono();

app_users_userid_profile.get('/', get);
app_users_userid_profile.patch('/', verifyJwtMW, createSupabaseSessMW, patch);

export default app_users_userid_profile;
