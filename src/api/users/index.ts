import { Hono } from 'hono';
import app_users_userid from './[userid]';
import { createSupabaseSessMWOptional } from '../_cmn/create_supasess';
import { verifyJwtMWOptional } from '../_cmn/verify_jwt';
// import bootstrap, { bootstrapMW } from './bootstrap';

const app_users = new Hono();

app_users.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

// /api/users/bootstrap: 認証ユーザーの users_master を作成（なければ）
// app_users.post('/bootstrap', bootstrapMW, bootstrap); // *! DB側のトリガーで作成されるはずなのでコメントアウトして様子見

app_users.route('/:userid', app_users_userid);

export default app_users;
