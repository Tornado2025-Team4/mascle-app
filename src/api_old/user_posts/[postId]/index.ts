import { Hono } from 'hono';
import get from './get';
import user_posts_postId_comments from './comments';
import user_posts_postId_likes from './likes';

const user_posts_postId = new Hono();

user_posts_postId.get('/', get);

user_posts_postId.route('/comments', user_posts_postId_comments);
user_posts_postId.route('/likes', user_posts_postId_likes);

export default user_posts_postId;
