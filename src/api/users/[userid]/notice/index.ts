import { Hono } from 'hono';
import get from './get';

const app_users_userid_notice = new Hono();

app_users_userid_notice.get('/', get);

export default app_users_userid_notice;
