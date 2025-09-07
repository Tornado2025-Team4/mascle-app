import { Hono } from 'hono';
import get from './get';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';
import app_users_userid_notices_noticeid from './[noticeid]';

const app_users_userid_notices = new Hono();

app_users_userid_notices.use(rejectSpecByAnonMW, verifyJwtMW, createSupabaseSessMW);

app_users_userid_notices.get('/', get);

app_users_userid_notices.route('/:noticeid', app_users_userid_notices_noticeid);

export default app_users_userid_notices;
