import { Hono } from 'hono';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import app_users_userid_config_privacy from './privacy';
import app_users_userid_config_misc from './misc';

const app_users_userid_config = new Hono();

app_users_userid_config.use(verifyJwtMW, createSupabaseSessMW);

app_users_userid_config.route('/privacy', app_users_userid_config_privacy);
app_users_userid_config.route('/misc', app_users_userid_config_misc);

export default app_users_userid_config;
