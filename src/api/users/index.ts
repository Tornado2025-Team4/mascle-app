import { Hono } from 'hono';
import app_users_userid from './[userid]';
import { createSupabaseSessMWOptional } from '../_cmn/create_supasess';
import { verifyJwtMWOptional } from '../_cmn/verify_jwt';
import get from './get';

const app_users = new Hono();

app_users.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

app_users.get('/', get);

app_users.route('/:userid', app_users_userid);

export default app_users;
