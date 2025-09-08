import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_posts_postid from './[postid]';
import { verifyJwtMW, verifyJwtMWOptional } from '../_cmn/verify_jwt';
import { createSupabaseSessMW, createSupabaseSessMWOptional } from '../_cmn/create_supasess';

const app_posts = new Hono();

app_posts.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

app_posts.get('/', get);
app_posts.post('/', verifyJwtMW, createSupabaseSessMW, post);

app_posts.route('/:postid', app_posts_postid);

export default app_posts;