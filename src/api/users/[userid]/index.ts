import { Hono } from 'hono';
import get from './get';
import { resolveUserIdMW } from './_cmn/userid_resolve';
import app_users_userid_profile from './profile';
import app_users_userid_config from './config';
import app_users_userid_status from './status';
import app_users_userid_menus from './menus';
import app_users_userid_menus_cardio from './menus_cardio';
import app_users_userid_notices from './notices';
import app_users_userid_rel from './rel';
import app_users_userid_current_gym from './current_gym';
import patch from './patch';
import { createSupabaseSessMW } from '../../_cmn/create_supasess';
import { verifyJwtMW } from '../../_cmn/verify_jwt';

const app_users_userid = new Hono();

app_users_userid.use(resolveUserIdMW);

app_users_userid.get('/', get);
app_users_userid.patch('/', verifyJwtMW, createSupabaseSessMW, patch);

app_users_userid.route('/profile', app_users_userid_profile);
app_users_userid.route('/config', app_users_userid_config);
app_users_userid.route('/status', app_users_userid_status);
app_users_userid.route('/menus', app_users_userid_menus);
app_users_userid.route('/menus_cardio', app_users_userid_menus_cardio);
app_users_userid.route('/notices', app_users_userid_notices);
app_users_userid.route('/rel', app_users_userid_rel);
app_users_userid.route('/current-gym', app_users_userid_current_gym);

export default app_users_userid;
