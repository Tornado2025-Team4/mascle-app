import { Hono } from 'hono';
import get from './get';
import app_users_userid_status_histories_historyid from './[history_id]';

const app_users_userid_status_histories = new Hono();

app_users_userid_status_histories.get('/', get);

app_users_userid_status_histories.route('/:history_id', app_users_userid_status_histories_historyid);

export default app_users_userid_status_histories;
