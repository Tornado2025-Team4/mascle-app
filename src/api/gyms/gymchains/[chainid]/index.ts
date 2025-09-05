import { Hono } from 'hono';
import get from './get';

const app_gymchains_chainid = new Hono();

app_gymchains_chainid.get('/', get);

export default app_gymchains_chainid;
