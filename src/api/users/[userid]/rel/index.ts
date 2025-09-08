import { Hono } from 'hono';
import app_users_userid_rel_followers from './followers';
import app_users_userid_rel_followings from './followings';
import app_users_userid_rel_blocks from './blocks';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';

const app_users_userid_rel = new Hono();

app_users_userid_rel.use(rejectSpecByAnonMW);

app_users_userid_rel.route('/followers', app_users_userid_rel_followers);
app_users_userid_rel.route('/followings', app_users_userid_rel_followings);
app_users_userid_rel.route('/blocks', app_users_userid_rel_blocks);

export default app_users_userid_rel;