import { Hono } from 'hono';
import get from './get';

const users_userId_followers = new Hono();

users_userId_followers.get('/', get);

export default users_userId_followers;
