import { Hono } from 'hono';
import get from './get';
import post from './post';
import del from './delete';
import { verifyJwtMW, verifyJwtMWOptional } from '../../../_cmn/verify_jwt';
import { createSupabaseSessMW, createSupabaseSessMWOptional } from '../../../_cmn/create_supasess';

const app_posts_postid_likes = new Hono();

app_posts_postid_likes.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

app_posts_postid_likes.get('/', get);
app_posts_postid_likes.post('/', verifyJwtMW, createSupabaseSessMW, post);
app_posts_postid_likes.delete('/', verifyJwtMW, createSupabaseSessMW, del);

export default app_posts_postid_likes;