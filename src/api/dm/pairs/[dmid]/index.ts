import { Hono } from 'hono';
import get from './get';
import app_dm_pairs_dmid_messages from './messages';

const app_dm_pairs_dmid = new Hono();

app_dm_pairs_dmid.get('/', get);

app_dm_pairs_dmid.route('/messages', app_dm_pairs_dmid_messages);

export default app_dm_pairs_dmid;