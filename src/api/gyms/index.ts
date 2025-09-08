import { Hono } from 'hono';
import get from './get';
import app_gyms_gymid from './[gymid]';

const app_gyms = new Hono();

app_gyms.get('/', get);
app_gyms.route('/:gymid', app_gyms_gymid);

export default app_gyms;