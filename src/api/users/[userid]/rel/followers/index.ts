import { Hono } from 'hono';
import get from './get';

const app_users_userid_rel_followers = new Hono();

app_users_userid_rel_followers.get('/', get);

export default app_users_userid_rel_followers;