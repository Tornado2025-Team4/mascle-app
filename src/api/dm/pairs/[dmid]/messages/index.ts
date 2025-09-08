import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_dm_pairs_dmid_messages_messageid from './[messageid]';

const app_dm_pairs_dmid_messages = new Hono();

app_dm_pairs_dmid_messages.get('/', get);
app_dm_pairs_dmid_messages.post('/', post);

app_dm_pairs_dmid_messages.route('/:messageid', app_dm_pairs_dmid_messages_messageid);

export default app_dm_pairs_dmid_messages;