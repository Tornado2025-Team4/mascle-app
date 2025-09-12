import { Hono } from 'hono';
import getApp from './get';

const app = new Hono();

app.route('/', getApp);

export default app;
