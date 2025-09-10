import { Hono } from 'hono';
import post from './post';
import app_users_userid_status_stateid from './[stateid]';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';
import get from './get';

const app_users_userid_status = new Hono();

app_users_userid_status.use(rejectSpecByAnonMW);

app_users_userid_status.get('/', get);
app_users_userid_status.post('/', verifyJwtMW, createSupabaseSessMW, post);

app_users_userid_status.route('/:stateid', app_users_userid_status_stateid);

export default app_users_userid_status;
