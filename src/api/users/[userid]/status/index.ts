import { Hono } from 'hono';
import get from './get';
import app_users_userid_status_start from './start';
import app_users_userid_status_finish from './finish';
import app_users_userid_status_histories from './histories';

const app_users_userid_status = new Hono();

app_users_userid_status.get('/', get);

app_users_userid_status.route('/start', app_users_userid_status_start);
app_users_userid_status.route('/finish', app_users_userid_status_finish);
app_users_userid_status.route('/histories', app_users_userid_status_histories);

export default app_users_userid_status;
