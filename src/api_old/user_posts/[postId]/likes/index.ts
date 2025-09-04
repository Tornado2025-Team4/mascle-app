import { Hono } from 'hono';
import get from './get';

const user_posts_postId_likes = new Hono();

user_posts_postId_likes.get('/', get);

export default user_posts_postId_likes;
