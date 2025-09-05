import { Hono } from 'hono';
import patch from './patch';

const app_users_userid_notices_noticeid = new Hono();

app_users_userid_notices_noticeid.patch('/', patch);

export default app_users_userid_notices_noticeid;
