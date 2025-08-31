import { Hono } from 'hono';
import get from './get';
import patch from './patch';

const app_users_userid_config_misc = new Hono();

app_users_userid_config_misc.get('/', get);

app_users_userid_config_misc.patch('/', patch);

export default app_users_userid_config_misc;