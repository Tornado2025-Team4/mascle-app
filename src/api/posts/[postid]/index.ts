import { Hono } from 'hono';
import get from './get';
import patch from './patch';
import del from './delete';
import app_posts_postid_comments from './comments';
import app_posts_postid_likes from './likes';
import { verifyJwtMW, verifyJwtMWOptional } from '../../_cmn/verify_jwt';
import { createSupabaseSessMW, createSupabaseSessMWOptional } from '../../_cmn/create_supasess';

const app_posts_postid = new Hono();

app_posts_postid.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

app_posts_postid.get('/', get);
app_posts_postid.patch('/', verifyJwtMW, createSupabaseSessMW, patch);
app_posts_postid.delete('/', verifyJwtMW, createSupabaseSessMW, del);

app_posts_postid.route('/comments', app_posts_postid_comments);
app_posts_postid.route('/likes', app_posts_postid_likes);

export default app_posts_postid;