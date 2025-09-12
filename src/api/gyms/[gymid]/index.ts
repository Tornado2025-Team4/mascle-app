import { Hono } from 'hono';
import get from './get';
import app_gyms_gymid_training_users from './training_users';

const app_gyms_gymid = new Hono();

app_gyms_gymid.get('/', get);
app_gyms_gymid.route('/training_users', app_gyms_gymid_training_users);

export default app_gyms_gymid;
