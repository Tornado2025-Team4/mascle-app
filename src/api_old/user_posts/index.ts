import { Hono } from 'hono';
import get from './get';
import user_posts_postId from './[postId]';
import { checkPostsAccessMW } from '../_mw/check_privacy_access';

const user_posts = new Hono();

user_posts.use(checkPostsAccessMW);

user_posts.get('/', get);

user_posts.route('/:postId', user_posts_postId);

export default user_posts;
