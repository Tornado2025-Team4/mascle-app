import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_users_userid_menus_cardio_menuid from './[menuid]';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';
import { rejectSpecByAnonMW } from '../_cmn/reject_spec_by_anon';

const app_users_userid_menus_cardio = new Hono();

app_users_userid_menus_cardio.use(rejectSpecByAnonMW);

app_users_userid_menus_cardio.get('/', get);
app_users_userid_menus_cardio.post('/', verifyJwtMW, createSupabaseSessMW, post);

app_users_userid_menus_cardio.route('/:menuid', app_users_userid_menus_cardio_menuid);

export default app_users_userid_menus_cardio;