import { Hono } from 'hono';
import get from './get';
import { resolveUserIdMW } from './_cmn/userid_resolve';
import app_users_userid_profile from './profile';
import app_users_userid_config from './config';
import app_users_userid_status from './status';

const app_users_userid = new Hono();

app_users_userid.use(resolveUserIdMW);

app_users_userid.get('/', get);

app_users_userid.route('/profile', app_users_userid_profile);
app_users_userid.route('/config', app_users_userid_config);
app_users_userid.route('/status', app_users_userid_status);

export default app_users_userid;
