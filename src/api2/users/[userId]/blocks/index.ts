import { Hono } from 'hono';
import get from './get';

const users_userId_blocks = new Hono();

users_userId_blocks.get('/', get);

export default users_userId_blocks;
