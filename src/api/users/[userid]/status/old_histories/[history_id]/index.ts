import { Hono } from 'hono';
import deleteHistory from './delete';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';

const app_users_userid_status_histories_historyid = new Hono();

app_users_userid_status_histories_historyid.delete('/', verifyJwtMW, createSupabaseSessMW, deleteHistory);

export default app_users_userid_status_histories_historyid;
