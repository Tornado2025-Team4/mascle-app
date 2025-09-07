import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_dm_pairs_dmid from './[dmid]';

const app_dm_pairs = new Hono();

app_dm_pairs.get('/', get);
app_dm_pairs.post('/', post);

app_dm_pairs.route('/:dmid', app_dm_pairs_dmid);

export default app_dm_pairs;