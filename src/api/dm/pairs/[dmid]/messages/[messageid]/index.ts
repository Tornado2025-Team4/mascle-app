import { Hono } from 'hono';
import get from './get';
import deleteMessage from './delete';

const app_dm_pairs_dmid_messages_messageid = new Hono();

app_dm_pairs_dmid_messages_messageid.get('/', get);
app_dm_pairs_dmid_messages_messageid.delete('/', deleteMessage);

export default app_dm_pairs_dmid_messages_messageid;