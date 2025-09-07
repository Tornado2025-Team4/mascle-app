import { Hono } from 'hono';
import get from './get';
import patch from './patch';
import app_users_userid_config_privacy_anon from './anon';

const app_users_userid_config_privacy = new Hono();

app_users_userid_config_privacy.get('/', get);
app_users_userid_config_privacy.patch('/', patch);

app_users_userid_config_privacy.route('/anon', app_users_userid_config_privacy_anon);

export default app_users_userid_config_privacy;
