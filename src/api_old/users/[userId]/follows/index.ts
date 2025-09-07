import { Hono } from 'hono';
import get from './get';

const users_userId_follows = new Hono();

users_userId_follows.get('/', get);

export default users_userId_follows;
