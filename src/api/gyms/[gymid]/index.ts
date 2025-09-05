import { Hono } from 'hono';
import get from './get';

const app_gyms_gymid = new Hono();

app_gyms_gymid.get('/', get);

export default app_gyms_gymid;
