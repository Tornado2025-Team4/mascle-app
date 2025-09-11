import { Hono } from 'hono';
import app_users_userid_rel_followers from './followers';
import app_users_userid_rel_followings from './followings';
import app_users_userid_rel_blocks from './blocks';
import partner_request from './partner_request';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';

const app_users_userid_rel = new Hono();

app_users_userid_rel.use(rejectSpecByAnonMW);

app_users_userid_rel.route('/followers', app_users_userid_rel_followers);
app_users_userid_rel.route('/followings', app_users_userid_rel_followings);
app_users_userid_rel.route('/blocks', app_users_userid_rel_blocks);

app_users_userid_rel.post('/partner_request', verifyJwtMW, createSupabaseSessMW, partner_request);

export default app_users_userid_rel;