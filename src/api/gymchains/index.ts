import { Hono } from 'hono';
import get from './get';
import app_gymchains_chainid from './[chainid]';

const app_gymchains = new Hono();

app_gymchains.get('/', get);
app_gymchains.route('/:chainid', app_gymchains_chainid);

export default app_gymchains;
