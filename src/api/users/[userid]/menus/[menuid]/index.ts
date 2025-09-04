import { Hono } from 'hono';
import patch from './patch';
import deleteMenu from './delete';
import { createSupabaseSessMW } from '@/src/api/_cmn/create_supasess';
import { verifyJwtMW } from '@/src/api/_cmn/verify_jwt';

const app_users_userid_menus_menuid = new Hono();

app_users_userid_menus_menuid.patch('/', verifyJwtMW, createSupabaseSessMW, patch);
app_users_userid_menus_menuid.delete('/', verifyJwtMW, createSupabaseSessMW, deleteMenu);

export default app_users_userid_menus_menuid;
