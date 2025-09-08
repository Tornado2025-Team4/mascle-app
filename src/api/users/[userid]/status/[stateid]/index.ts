import { Hono } from 'hono';
import get from './get';
import patch from './patch';
import deleteStatus from './delete';
import app_users_userid_status_stateid_finish from './finish';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';

const app_users_userid_status_stateid = new Hono();

app_users_userid_status_stateid.get('/', get);
app_users_userid_status_stateid.patch('/', verifyJwtMW, createSupabaseSessMW, patch);
app_users_userid_status_stateid.delete('/', verifyJwtMW, createSupabaseSessMW, deleteStatus);

app_users_userid_status_stateid.route('/finish', app_users_userid_status_stateid_finish);

export default app_users_userid_status_stateid;