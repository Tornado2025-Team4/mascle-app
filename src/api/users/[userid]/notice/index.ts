import { Hono } from 'hono';
import get from './get';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';

const app_users_userid_notice = new Hono();

app_users_userid_notice.use(rejectSpecByAnonMW);

app_users_userid_notice.get('/', verifyJwtMW, createSupabaseSessMW, get);

export default app_users_userid_notice;
