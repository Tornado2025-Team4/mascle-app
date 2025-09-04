import { Hono } from 'hono';
import get from './get';

const user_posts_postId_comments = new Hono();

user_posts_postId_comments.get('/', get);

export default user_posts_postId_comments;
