import { Hono } from 'hono';
import get from './get';

const app_tags = new Hono();

app_tags.get('/', get);

export default app_tags;
