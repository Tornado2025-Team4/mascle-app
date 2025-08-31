import { Hono } from 'hono';
import get from './get';
import patch from './patch';

const app_users_userid_config_privacy_anon = new Hono();

app_users_userid_config_privacy_anon.get('/', get);
app_users_userid_config_privacy_anon.patch('/', patch);

export default app_users_userid_config_privacy_anon;
