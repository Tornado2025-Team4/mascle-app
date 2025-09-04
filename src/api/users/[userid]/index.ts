import { Hono } from 'hono';
import get from './get';
import { resolveUserIdMW } from './_cmn/userid_resolve';
import app_users_userid_profile from './profile';
import app_users_userid_config from './config';
import app_users_userid_status from './status';
import app_users_userid_menus from './menus';
import app_users_userid_menus_cardio from './menus_cardio';
import app_users_userid_notice from './notice';
import patch from './patch';
import { createSupabaseSessMW } from '../../_cmn/create_supasess';
import { verifyJwtMW } from '../../_cmn/verify_jwt';
import { rejectSpecByAnonMW } from './_cmn/reject_spec_by_anon';

const app_users_userid = new Hono();

app_users_userid.use(resolveUserIdMW);

app_users_userid.get('/', get);
app_users_userid.patch('/', verifyJwtMW, createSupabaseSessMW, patch);

app_users_userid.route('/profile', app_users_userid_profile);
app_users_userid.route('/config', app_users_userid_config);
app_users_userid.route('/status', app_users_userid_status);
app_users_userid.route('/menus', app_users_userid_menus);
app_users_userid.route('/menus_cardio', app_users_userid_menus_cardio);
app_users_userid.route('/notice', app_users_userid_notice);

export default app_users_userid;
