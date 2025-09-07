import { Hono } from 'hono';
import get from './get';
import post from './post';
import app_comments_commentid from './[commentid]';
import { verifyJwtMW, verifyJwtMWOptional } from '../../../_cmn/verify_jwt';
import { createSupabaseSessMW, createSupabaseSessMWOptional } from '../../../_cmn/create_supasess';

const app_posts_postid_comments = new Hono();

app_posts_postid_comments.use(verifyJwtMWOptional, createSupabaseSessMWOptional);

app_posts_postid_comments.get('/', get);
app_posts_postid_comments.post('/', verifyJwtMW, createSupabaseSessMW, post);

app_posts_postid_comments.route('/:commentid', app_comments_commentid);

export default app_posts_postid_comments;