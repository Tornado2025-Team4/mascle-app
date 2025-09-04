import { Hono } from 'hono';
import get from './get';

const user_tags = new Hono();

user_tags.get('/', get);

export default user_tags;
